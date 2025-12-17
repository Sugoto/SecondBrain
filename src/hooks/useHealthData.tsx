import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserStats } from "@/lib/supabase";

const healthKeys = {
  all: ["health"] as const,
  stats: () => [...healthKeys.all, "stats"] as const,
};

async function fetchUserStats(): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching user stats:", error);
    return null;
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

  const {
    data: userStats,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: healthKeys.stats(),
    queryFn: fetchUserStats,
  });

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

