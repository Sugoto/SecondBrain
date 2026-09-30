import { QueryClient } from "@tanstack/react-query";
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { getCachedTransactions, cacheTransactions } from "@/lib/db";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
      refetchOnMount: true,
    },
  },
});

const transactionsKey = ["transactions", "list"] as const;

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(500);

  if (error) {
    const cached = await getCachedTransactions();
    if (cached) return cached;
    throw error;
  }

  void cacheTransactions(data);
  return data;
}

export const transactionsCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: transactionsKey,
    queryFn: fetchTransactions,
    getKey: (t: Transaction) => t.id,
    onInsert: async ({ transaction }) => {
      const { error } = await supabase
        .from("transactions")
        .insert(transaction.mutations.map((m) => m.modified));
      if (error) throw error;
    },
    onUpdate: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const { error } = await supabase.from("transactions").update(m.changes).eq("id", m.key);
        if (error) throw error;
      }
    },
    onDelete: async ({ transaction }) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in(
          "id",
          transaction.mutations.map((m) => m.key),
        );
      if (error) throw error;
    },
  }),
);

if (typeof window !== "undefined") {
  void getCachedTransactions(true).then((cached) => {
    if (cached && !queryClient.getQueryData(transactionsKey)) {
      queryClient.setQueryData(transactionsKey, cached, { updatedAt: 0 });
    }
  });
}
