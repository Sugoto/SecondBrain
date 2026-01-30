import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    return getCachedUserStats(true);
  }

  if (data) {
    cacheUserStats(data);
  }

  return data;
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

  return {
    userStats,
    loading,
    error: error ? (error as Error).message : null,
    refetch,

    updateInCache: (updated: UserStats) => {
      queryClient.setQueryData<UserStats>(healthKeys.stats(), updated);
      cacheUserStats(updated);
    },

    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: healthKeys.all }),
  };
}
