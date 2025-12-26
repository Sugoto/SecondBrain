import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase, type UserStats, type ActivityLevel, type ActivityLog, type StepLog } from "@/lib/supabase";
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
  stepLog: StepLog;
  manualDates: string[];
}

async function updateActivityData(
  { userId, activityLog, stepLog, manualDates }: ActivityUpdate
): Promise<ActivityUpdate> {
  const { error } = await supabase
    .from("user_stats")
    .update({ 
      activity_log: activityLog,
      step_log: stepLog,
      manual_activity_dates: manualDates,
    })
    .eq("id", userId);

  if (error) throw error;
  return { userId, activityLog, stepLog, manualDates };
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
    onSuccess: ({ activityLog, stepLog, manualDates }) => {
      queryClient.setQueryData<UserStats | null>(healthKeys.stats(), (old) => {
        if (!old) return null;
        const updated = { ...old, activity_log: activityLog, step_log: stepLog, manual_activity_dates: manualDates };
        cacheUserStats(updated);
        return updated;
      });
    },
  });

  const activityLog: ActivityLog = userStats?.activity_log ?? {};
  const stepLog: StepLog = userStats?.step_log ?? {};
  const manualActivityDates = new Set(userStats?.manual_activity_dates ?? []);
  
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
      
      updateCaches({ activity_log: newLog, manual_activity_dates: manualDatesArray });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: newLog, 
        stepLog,
        manualDates: manualDatesArray 
      });
    },
    
    // Merge from Google Fit (respects manual entries)
    mergeActivityLog: (newActivityEntries: ActivityLog, newStepEntries: StepLog) => {
      if (!userStats?.id) return;
      
      const mergedActivityLog = { ...activityLog };
      const mergedStepLog = { ...stepLog, ...newStepEntries }; // Always update steps
      
      // Only update activity for non-manual dates
      for (const [date, level] of Object.entries(newActivityEntries)) {
        if (!manualActivityDates.has(date)) {
          mergedActivityLog[date] = level;
        }
      }
      
      const manualDatesArray = [...manualActivityDates].sort();
      
      updateCaches({ activity_log: mergedActivityLog, step_log: mergedStepLog });
      activityMutation.mutate({ 
        userId: userStats.id, 
        activityLog: mergedActivityLog, 
        stepLog: mergedStepLog,
        manualDates: manualDatesArray 
      });
    },
    
    isActivitySaving: activityMutation.isPending,
  };
}
