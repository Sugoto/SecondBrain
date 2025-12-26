import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase, type UserStats, type ActivityLevel, type ActivityLog, type StepLog } from "@/lib/supabase";
import { getCachedUserStats, cacheUserStats } from "@/lib/db";
import { stepsToActivityLevel } from "@/hooks/useGoogleFit";

// Activity level priority: sedentary < light < moderate < heavy
const ACTIVITY_PRIORITY: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 1,
  moderate: 2,
  heavy: 3,
};

// Get activity level considering workout status (workout = at least moderate)
function getActivityLevel(steps: number, isWorkout: boolean): ActivityLevel {
  const stepLevel = stepsToActivityLevel(steps);
  if (isWorkout) {
    // Workout days are at least moderate
    return ACTIVITY_PRIORITY[stepLevel] >= ACTIVITY_PRIORITY.moderate 
      ? stepLevel 
      : "moderate";
  }
  return stepLevel;
}

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
  stepLog: StepLog;
  manualDates: string[];
  workoutDates: string[];
}

async function updateActivityData(
  { userId, activityLog, stepLog, manualDates, workoutDates }: ActivityUpdate
): Promise<ActivityUpdate> {
  const { error } = await supabase
    .from("user_stats")
    .update({ 
      activity_log: activityLog,
      step_log: stepLog,
      manual_activity_dates: manualDates,
      workout_dates: workoutDates,
    })
    .eq("id", userId);

  if (error) throw error;
  return { userId, activityLog, stepLog, manualDates, workoutDates };
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
    onSuccess: ({ activityLog, stepLog, manualDates, workoutDates }) => {
      queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) => {
        if (!old) return null;
        const updated = { 
          ...old, 
          activity_log: activityLog, 
          step_log: stepLog, 
          manual_activity_dates: manualDates,
          workout_dates: workoutDates,
        };
        cacheUserStats(updated);
        return updated;
      });
    },
  });

  const activityLog: ActivityLog = userStats?.activity_log ?? {};
  const stepLog: StepLog = userStats?.step_log ?? {};
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

    // Activity & step log
    activityLog,
    stepLog,
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
        stepLog,
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
    
    // Merge from Google Fit - keeps the GREATER step count for each date
    mergeActivityLog: (_newActivityEntries: ActivityLog, newStepEntries: StepLog) => {
      if (!userStats?.id) return;
      
      const mergedActivityLog = { ...activityLog };
      const mergedStepLog = { ...stepLog };
      
      // For each date, keep the greater step count
      for (const [date, newSteps] of Object.entries(newStepEntries)) {
        const existingSteps = stepLog[date] ?? 0;
        const greaterSteps = Math.max(existingSteps, newSteps);
        mergedStepLog[date] = greaterSteps;
        
        // Update activity level based on the greater step count
        // But respect manual activity entries - don't override those
        // Workout days get at least moderate
        if (!manualActivityDates.has(date)) {
          mergedActivityLog[date] = getActivityLevel(greaterSteps, workoutDates.has(date));
        }
      }
      
      const manualDatesArray = [...manualActivityDates].sort();
      const workoutDatesArray = [...workoutDates].sort();
      
      updateCaches({ activity_log: mergedActivityLog, step_log: mergedStepLog });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: mergedActivityLog, 
        stepLog: mergedStepLog,
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
    
    isActivitySaving: activityMutation.isPending,
    
    // Workout dates
    workoutDates,
    
    // Toggle workout for a date - also updates activity level
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
        const steps = stepLog[date] ?? 0;
        newActivityLog[date] = getActivityLevel(steps, isAdding);
      }
      
      const workoutDatesArray = [...newWorkoutDates].sort();
      const manualDatesArray = [...manualActivityDates].sort();
      
      updateCaches({ workout_dates: workoutDatesArray, activity_log: newActivityLog });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: newActivityLog, 
        stepLog,
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
  };
}
