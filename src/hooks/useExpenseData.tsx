import { useQuery, useQueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLiveQuery } from "@tanstack/react-db";
import { supabase } from "@/lib/supabase";
import type { Transaction, UserStats, Investment } from "@/lib/supabase";
import { useState, useEffect, type ReactNode } from "react";
import { getCachedUserStats, cacheUserStats } from "@/lib/db";
import { queryClient, transactionsCollection } from "@/lib/collections";

let cachedUserStatsPromise: Promise<UserStats | null> | null = null;

if (typeof window !== "undefined") {
  cachedUserStatsPromise = getCachedUserStats(true);
}

const userStatsKeys = {
  all: ["userStats"] as const,
  detail: () => [...userStatsKeys.all, "detail"] as const,
};

/**
 * Fetch user stats with IndexedDB cache
 */
async function fetchUserStats(): Promise<UserStats | null> {
  // Try cache first
  const cached = await getCachedUserStats();

  const { data, error } = await supabase.from("user_stats").select("*").limit(1).single();

  if (error) {
    console.error("Error fetching user stats:", error);
    return cached; // Return cache on error
  }

  // Cache fresh data
  if (data) {
    cacheUserStats(data);
  }

  return data || cached;
}

export function ExpenseDataProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function useExpenseData() {
  const { data, isLoading } = useLiveQuery((q) =>
    q
      .from({ t: transactionsCollection })
      .orderBy(({ t }) => t.date, "desc")
      .orderBy(({ t }) => t.time, "desc"),
  );
  const transactions: Transaction[] = data ?? [];

  return {
    transactions,
    loading: isLoading && transactions.length === 0,

    addTransaction: (transaction: Transaction) =>
      transactionsCollection.insert({
        ...transaction,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }).isPersisted.promise,
    updateTransaction: (transaction: Transaction) =>
      transactionsCollection.update(transaction.id, (draft) => {
        Object.assign(draft, transaction);
      }).isPersisted.promise,
    deleteTransaction: (id: string) => transactionsCollection.delete(id).isPersisted.promise,
  };
}

/**
 * Prefetch transactions data - call this on home page to warm the cache
 */
export function usePrefetchTransactions() {
  return {
    prefetch: () => {
      void transactionsCollection.preload();
    },
  };
}

export function useUserStats() {
  const queryClient = useQueryClient();

  // Get initial cached data for instant display (same pattern as useExpenseData)
  const [initialData, setInitialData] = useState<UserStats | undefined>(undefined);

  // Load initial data from IndexedDB on mount
  useEffect(() => {
    cachedUserStatsPromise?.then((cached) => {
      if (!cached) return;
      // Skip if React Query already has fresher data (e.g. after a save).
      if (queryClient.getQueryData(userStatsKeys.detail())) return;
      queryClient.setQueryData(userStatsKeys.detail(), cached);
      setInitialData(cached);
    });
  }, [queryClient]);

  const {
    data: userStats = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: userStatsKeys.detail(),
    queryFn: fetchUserStats,
    placeholderData: initialData,
    staleTime: 10 * 60 * 1000, // 10 minutes - user stats change less frequently
  });

  const loading = isLoading && !userStats && !initialData;

  const updateUserStats = (updated: UserStats) => {
    queryClient.setQueryData<UserStats | null>(userStatsKeys.detail(), updated);
    // Also update IndexedDB cache
    cacheUserStats(updated);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: userStatsKeys.all });

  // Investment management
  const addInvestment = async (investment: Omit<Investment, "id">) => {
    if (!userStats?.id) throw new Error("No user stats");

    const newInvestment: Investment = {
      ...investment,
      id: crypto.randomUUID(),
    };

    const currentInvestments = userStats.investments || [];
    const updatedInvestments = [...currentInvestments, newInvestment];

    const { error } = await supabase
      .from("user_stats")
      .update({ investments: updatedInvestments })
      .eq("id", userStats.id);

    if (error) throw error;

    const updated = { ...userStats, investments: updatedInvestments };
    queryClient.setQueryData<UserStats | null>(userStatsKeys.detail(), updated);
    cacheUserStats(updated);
    return newInvestment;
  };

  const deleteInvestment = async (investmentId: string) => {
    if (!userStats?.id) throw new Error("No user stats");

    const currentInvestments = userStats.investments || [];
    const updatedInvestments = currentInvestments.filter((i) => i.id !== investmentId);

    const { error } = await supabase
      .from("user_stats")
      .update({ investments: updatedInvestments })
      .eq("id", userStats.id);

    if (error) throw error;

    const updated = { ...userStats, investments: updatedInvestments };
    queryClient.setQueryData<UserStats | null>(userStatsKeys.detail(), updated);
    cacheUserStats(updated);
  };

  return {
    userStats,
    loading,
    error: error ? (error as Error).message : null,
    updateUserStats,
    invalidate,
    addInvestment,
    deleteInvestment,
  };
}
