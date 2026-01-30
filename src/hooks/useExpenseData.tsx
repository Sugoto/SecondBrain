import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Transaction, UserStats, Investment } from "@/lib/supabase";
import { useState, useEffect, type ReactNode } from "react";
import {
  getCachedTransactions,
  cacheTransactions,
  getCachedUserStats,
  cacheUserStats,
} from "@/lib/db";

// Pre-load cache data before React Query kicks in
// This allows instant display of cached data
let cachedTransactionsPromise: Promise<Transaction[] | null> | null = null;
let cachedUserStatsPromise: Promise<UserStats | null> | null = null;

// Start loading cache immediately on module load
if (typeof window !== 'undefined') {
  cachedTransactionsPromise = getCachedTransactions(true); // allowStale=true for instant load
  cachedUserStatsPromise = getCachedUserStats(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
      // Always refetch but show stale data immediately
      refetchOnMount: true,
    },
  },
});

// Export for prefetching
export { queryClient };

const expenseKeys = {
  all: ["transactions"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
};

const userStatsKeys = {
  all: ["userStats"] as const,
  detail: () => [...userStatsKeys.all, "detail"] as const,
};

/**
 * Fetch transactions with IndexedDB cache-first strategy
 * Returns cached data instantly, then fetches fresh data in background
 */
async function fetchTransactions(): Promise<Transaction[]> {
  // Try cache first for instant load
  const cached = await getCachedTransactions();

  // Fetch fresh data
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(500);

  if (error) {
    // If network fails, return cache if available
    if (cached) return cached;
    throw error;
  }

  // Cache the fresh data for next time
  if (data) {
    cacheTransactions(data); // Fire and forget
  }

  return data || cached || [];
}

/**
 * Fetch user stats with IndexedDB cache
 */
async function fetchUserStats(): Promise<UserStats | null> {
  // Try cache first
  const cached = await getCachedUserStats();

  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .limit(1)
    .single();

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
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function useExpenseData() {
  const queryClient = useQueryClient();

  // Get initial cached data for instant display
  const [initialData, setInitialData] = useState<Transaction[] | undefined>(undefined);

  // Load initial data from IndexedDB on mount (only once)
  useEffect(() => {
    cachedTransactionsPromise?.then((cached) => {
      if (cached && cached.length > 0) {
        // Prime the query cache with stale data for instant display
        queryClient.setQueryData(expenseKeys.lists(), cached);
        setInitialData(cached);
      }
    });
  }, [queryClient]);

  const {
    data: transactions = [],
    isLoading,
    isRefetching: refreshing,
    error,
    refetch,
  } = useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: fetchTransactions,
    // Show cached data as placeholder while fetching
    placeholderData: initialData,
  });

  // Consider "loading" only if no data at all (no cache, no fetched data)
  const loading = isLoading && transactions.length === 0 && !initialData;

  const addMutation = useMutation({
    mutationFn: async (
      newTransaction: Omit<Transaction, "id" | "created_at">
    ) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(newTransaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newTransaction) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old ? [newTransaction, ...old] : [newTransaction]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          amount: transaction.amount,
          merchant: transaction.merchant,
          date: transaction.date,
          time: transaction.time,
          category: transaction.category,
          excluded_from_budget: transaction.excluded_from_budget,
          details: transaction.details,
          prorate_months: transaction.prorate_months,
          budget_type: transaction.budget_type,
        })
        .eq("id", transaction.id);

      if (error) throw error;
      return transaction;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old?.map((t) =>
          t.id === updatedTransaction.id ? updatedTransaction : t
        )
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old?.filter((t) => t.id !== deletedId)
      );
    },
  });

  return {
    transactions,
    loading,
    refreshing,
    error: error ? (error as Error).message : null,

    fetchTransactions: () => refetch(),

    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,

    addToCache: (transaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old ? [transaction, ...old] : [transaction]
      );
    },
    updateInCache: (transaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old?.map((t) => (t.id === transaction.id ? transaction : t))
      );
    },
    removeFromCache: (id: string) => {
      queryClient.setQueryData<Transaction[]>(expenseKeys.lists(), (old) =>
        old?.filter((t) => t.id !== id)
      );
    },

    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  };
}

/**
 * Prefetch transactions data - call this on home page to warm the cache
 */
export function usePrefetchTransactions() {
  const qc = useQueryClient();

  return {
    prefetch: () => {
      qc.prefetchQuery({
        queryKey: expenseKeys.lists(),
        queryFn: fetchTransactions,
        staleTime: 5 * 60 * 1000,
      });
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
      if (cached) {
        queryClient.setQueryData(userStatsKeys.detail(), cached);
        setInitialData(cached);
      }
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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: userStatsKeys.all });

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
    const updatedInvestments = currentInvestments.filter(i => i.id !== investmentId);

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
