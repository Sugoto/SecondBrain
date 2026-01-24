import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase, type UserStats, type ActivityLevel, type ActivityLog } from "@/lib/supabase";
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
    return getCachedUserStats(true);
  }
  
  if (data) {
    cacheUserStats(data);
  }
  
  return data;
}

interface ActivityUpdate {
  userId: string;
  activityLog: ActivityLog;
  manualDates: string[];
  workoutDates: string[];
}

async function updateActivityData(
  { userId, activityLog, manualDates, workoutDates }: ActivityUpdate
): Promise<ActivityUpdate> {
  const { error } = await supabase
    .from("user_stats")
    .update({ 
      activity_log: activityLog,
      manual_activity_dates: manualDates,
      workout_dates: workoutDates,
    })
    .eq("id", userId);

  if (error) throw error;
  return { userId, activityLog, manualDates, workoutDates };
}

export function useHealthData() {
  const queryClient = useQueryClient();
  const [initialData, setInitialData] = useState<UserStats | undefined>(undefined);
  
  useEffect(() => {
    cachedHealthStatsPromise?.then((cached) => {
      if (cached) {
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
  
  const loading = isLoading && !userStats && !initialData;

  const activityMutation = useMutation({
    mutationFn: updateActivityData,
    onSuccess: ({ activityLog, manualDates, workoutDates }) => {
      queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) => {
        if (!old) return null;
        const updated = { 
          ...old, 
          activity_log: activityLog, 
          manual_activity_dates: manualDates,
          workout_dates: workoutDates,
        };
        cacheUserStats(updated);
        return updated;
      });
    },
  });

  const activityLog: ActivityLog = userStats?.activity_log ?? {};
  const manualActivityDates = new Set(userStats?.manual_activity_dates ?? []);
  const workoutDates = new Set(userStats?.workout_dates ?? []);
  
  const updateCaches = useCallback((updates: Partial<UserStats>) => {
    queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) => {
      if (!old) return null;
      const updated = { ...old, ...updates };
      cacheUserStats(updated);
      return updated;
    });
  }, [queryClient]);

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

    // Activity log
    activityLog,
    manualActivityDates,
    
    // Set activity level manually
    setActivityLevel: (date: string, level: ActivityLevel | null) => {
      if (!userStats?.id) return;
      
      const newLog = { ...activityLog };
      const newManualDates = new Set(manualActivityDates);
      
      if (level === null) {
        delete newLog[date];
        newManualDates.delete(date);
      } else {
        newLog[date] = level;
        newManualDates.add(date);
      }
      
      const manualDatesArray = [...newManualDates].sort();
      const workoutDatesArray = [...workoutDates].sort();
      
      updateCaches({ activity_log: newLog, manual_activity_dates: manualDatesArray });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: newLog, 
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
    
    isActivitySaving: activityMutation.isPending,
    
    // Workout dates
    workoutDates,
    
    // Toggle workout for a date - updates activity level to at least moderate
    toggleWorkout: (date: string) => {
      if (!userStats?.id) return;
      
      const newWorkoutDates = new Set(workoutDates);
      const isAdding = !newWorkoutDates.has(date);
      
      if (isAdding) {
        newWorkoutDates.add(date);
      } else {
        newWorkoutDates.delete(date);
      }
      
      // Update activity level based on workout status (unless manually set)
      const newActivityLog = { ...activityLog };
      if (!manualActivityDates.has(date)) {
        // Workout days are at least moderate
        if (isAdding) {
          newActivityLog[date] = "moderate";
        } else {
          // When removing workout, reset to sedentary unless there's existing activity
          delete newActivityLog[date];
        }
      }
      
      const workoutDatesArray = [...newWorkoutDates].sort();
      const manualDatesArray = [...manualActivityDates].sort();
      
      updateCaches({ 
        workout_dates: workoutDatesArray, 
        activity_log: newActivityLog,
      });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: newActivityLog, 
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
  };
}
