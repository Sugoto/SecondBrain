import { QueryClient } from "@tanstack/react-query";
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { supabase } from "@/lib/supabase";
import type { Transaction, UserStats, ShoppingItem, OmscsCourse, Workout } from "@/lib/supabase";

export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: true,
      retry: 2,
      refetchOnMount: true,
    },
  },
});

function tableCollection<T extends { id: string }>(
  table: string,
  fetchRows: () => PromiseLike<{ data: T[] | null; error: Error | null }>,
) {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [table],
      queryFn: async () => {
        const { data, error } = await fetchRows();
        if (error) throw error;
        return data ?? [];
      },
      getKey: (row: T) => row.id,
      onInsert: async ({ transaction }) => {
        const { error } = await supabase
          .from(table)
          .insert(transaction.mutations.map((m) => m.modified));
        if (error) throw error;
      },
      onUpdate: async ({ transaction }) => {
        for (const m of transaction.mutations) {
          const { error } = await supabase
            .from(table)
            .update(m.changes as Record<string, unknown>)
            .eq("id", m.key);
          if (error) throw error;
        }
      },
      onDelete: async ({ transaction }) => {
        const { error } = await supabase
          .from(table)
          .delete()
          .in(
            "id",
            transaction.mutations.map((m) => m.key),
          );
        if (error) throw error;
      },
    }),
  );
}

const selectAll =
  <T extends { id: string }>(table: string) =>
  () =>
    supabase.from(table).select("*").overrideTypes<T[]>();

export const transactionsCollection = tableCollection<Transaction>("transactions", () =>
  supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(500)
    .overrideTypes<Transaction[]>(),
);

export const userStatsCollection = tableCollection<UserStats>(
  "user_stats",
  selectAll<UserStats>("user_stats"),
);

export const shoppingCollection = tableCollection<ShoppingItem>(
  "shopping_list",
  selectAll<ShoppingItem>("shopping_list"),
);

export const omscsCoursesCollection = tableCollection<OmscsCourse>(
  "omscs_courses",
  selectAll<OmscsCourse>("omscs_courses"),
);

export const workoutsCollection = tableCollection<Workout>(
  "workouts",
  selectAll<Workout>("workouts"),
);
