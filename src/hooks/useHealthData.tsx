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

// Bonus steps added when marking a day as workout
const WORKOUT_STEP_BONUS = 1000;

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
    // Preserves workout bonus: incoming steps + bonus (if workout) vs existing
    mergeActivityLog: (_newActivityEntries: ActivityLog, newStepEntries: StepLog) => {
      if (!userStats?.id) return;
      
      const mergedActivityLog = { ...activityLog };
      const mergedStepLog = { ...stepLog };
      
      // For each date, keep the greater step count
      for (const [date, newSteps] of Object.entries(newStepEntries)) {
        const existingSteps = stepLog[date] ?? 0;
        const isWorkout = workoutDates.has(date);
        // Add workout bonus to incoming steps if this is a workout day
        // This ensures the bonus is preserved when syncing
        const incomingStepsWithBonus = newSteps + (isWorkout ? WORKOUT_STEP_BONUS : 0);
        const greaterSteps = Math.max(existingSteps, incomingStepsWithBonus);
        mergedStepLog[date] = greaterSteps;
        
        // Update activity level based on the greater step count
        // But respect manual activity entries - don't override those
        // Workout days get at least moderate
        if (!manualActivityDates.has(date)) {
          mergedActivityLog[date] = getActivityLevel(greaterSteps, isWorkout);
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
    
    // Toggle workout for a date - also updates activity level and step count
    // Idempotent: only adds/removes bonus once based on workout state transition
    toggleWorkout: (date: string) => {
      if (!userStats?.id) return;
      
      const newWorkoutDates = new Set(workoutDates);
      const newStepLog = { ...stepLog };
      const isAdding = !newWorkoutDates.has(date);
      
      if (isAdding) {
        // Mark as workout - add step bonus (only happens when transitioning to workout)
        newWorkoutDates.add(date);
        newStepLog[date] = (newStepLog[date] ?? 0) + WORKOUT_STEP_BONUS;
      } else {
        // Unmark workout - remove step bonus (only happens when transitioning from workout)
        newWorkoutDates.delete(date);
        // Never go below 0
        newStepLog[date] = Math.max(0, (newStepLog[date] ?? 0) - WORKOUT_STEP_BONUS);
      }
      
      // Update activity level based on workout status and new step count (unless manually set)
      const newActivityLog = { ...activityLog };
      if (!manualActivityDates.has(date)) {
        newActivityLog[date] = getActivityLevel(newStepLog[date], isAdding);
      }
      
      const workoutDatesArray = [...newWorkoutDates].sort();
      const manualDatesArray = [...manualActivityDates].sort();
      
      updateCaches({ 
        workout_dates: workoutDatesArray, 
        activity_log: newActivityLog,
        step_log: newStepLog,
      });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: newActivityLog, 
        stepLog: newStepLog,
        manualDates: manualDatesArray,
        workoutDates: workoutDatesArray,
      });
    },
  };
}
