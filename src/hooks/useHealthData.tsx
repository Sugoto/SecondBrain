import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase, type UserStats } from "@/lib/supabase";
import { getCachedUserStats, cacheUserStats } from "@/lib/db";

const healthKeys = {
  all: ["health"] as const,
  stats: () => [...healthKeys.all, "stats"] as const,
};

// Pre-load cache on module initialization for instant display
let cachedHealthStatsPromise: Promise<UserStats | null> | null = null;
if (typeof window !== 'undefined') {
  cachedHealthStatsPromise = getCachedUserStats(true); // allowStale=true
}

async function fetchUserStats(): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching user stats:", error);
    // Return stale cache on network error
    return getCachedUserStats(true);
  }
  
  // Cache fresh data for next time
  if (data) {
    cacheUserStats(data);
  }
  
  return data;
}

async function updateWorkoutDates(
  userId: string,
  workoutDates: string[]
): Promise<string[]> {
  const { error } = await supabase
    .from("user_stats")
    .update({ workout_dates: workoutDates })
    .eq("id", userId);

  if (error) throw error;
  return workoutDates;
}

export function useHealthData() {
  const queryClient = useQueryClient();
  
  // Get initial cached data for instant display
  const [initialData, setInitialData] = useState<UserStats | undefined>(undefined);
  
  // Load initial data from IndexedDB on mount (only once)
  useEffect(() => {
    cachedHealthStatsPromise?.then((cached) => {
      if (cached) {
        // Prime the query cache with stale data for instant display
        queryClient.setQueryData(healthKeys.stats(), cached);
        setInitialData(cached);
      }
    });
  }, [queryClient]);

  const {
    data: userStats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: healthKeys.stats(),
    queryFn: fetchUserStats,
    placeholderData: initialData,
  });
  
  // Only show loading if we have no data at all
  const loading = isLoading && !userStats && !initialData;

  const workoutMutation = useMutation({
    mutationFn: ({ userId, dates }: { userId: string; dates: string[] }) =>
      updateWorkoutDates(userId, dates),
    onSuccess: (newDates) => {
      // Update cache optimistically
      queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) =>
        old ? { ...old, workout_dates: newDates } : null
      );
    },
  });

  return {
    userStats,
    loading,
    error: error ? (error as Error).message : null,

    refetch,

    updateInCache: (updated: UserStats) => {
      queryClient.setQueryData<UserStats>(healthKeys.stats(), updated);
    },

    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: healthKeys.all }),

    // Workout dates helpers
    workoutDates: new Set(userStats?.workout_dates ?? []),
    
    toggleWorkoutDate: (date: string) => {
      if (!userStats?.id) return;
      
      const currentDates = new Set(userStats.workout_dates ?? []);
      if (currentDates.has(date)) {
        currentDates.delete(date);
      } else {
        currentDates.add(date);
      }
      
      const newDates = [...currentDates].sort();
      
      // Optimistic update
      queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) =>
        old ? { ...old, workout_dates: newDates } : null
      );
      
      // Persist to Supabase
      workoutMutation.mutate({ userId: userStats.id, dates: newDates });
    },
    
    isWorkoutSaving: workoutMutation.isPending,
  };
}

