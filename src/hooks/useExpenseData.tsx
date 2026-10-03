import { QueryClientProvider } from "@tanstack/react-query";
import { useLiveQuery } from "@tanstack/react-db";
import type { Transaction, UserStats, Investment } from "@/lib/supabase";
import type { ReactNode } from "react";
import { queryClient, transactionsCollection, userStatsCollection } from "@/lib/collections";
import { deleteWithUndo } from "@/lib/undo";
import { showUndo } from "@/components/ui/snackbar";

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
    deleteTransaction: (id: string) =>
      deleteWithUndo(transactionsCollection, id, "Expense deleted"),
  };
}

export function usePrefetchTransactions() {
  return {
    prefetch: () => {
      void transactionsCollection.preload();
    },
  };
}

export function useUserStats() {
  const { data, isLoading, isError } = useLiveQuery((q) => q.from({ s: userStatsCollection }));
  const userStats: UserStats | null = data[0] ?? null;

  const saveInvestments = (investments: Investment[]) => {
    if (!userStats) throw new Error("No user stats");
    return userStatsCollection.update(userStats.id, (draft) => {
      draft.investments = investments;
    }).isPersisted.promise;
  };

  const addInvestment = async (investment: Omit<Investment, "id">) => {
    const newInvestment: Investment = { ...investment, id: crypto.randomUUID() };
    await saveInvestments([...(userStats?.investments ?? []), newInvestment]);
    return newInvestment;
  };

  const deleteInvestment = async (investmentId: string) => {
    const removed = userStats?.investments?.find((i) => i.id === investmentId);
    const statsId = userStats?.id;
    await saveInvestments((userStats?.investments ?? []).filter((i) => i.id !== investmentId));
    if (!removed || !statsId) return;
    showUndo("Investment deleted", () => {
      const latest = userStatsCollection.get(statsId)?.investments ?? [];
      if (latest.some((i) => i.id === removed.id)) return;
      return userStatsCollection.update(statsId, (draft) => {
        draft.investments = [...latest, removed];
      }).isPersisted.promise;
    });
  };

  return {
    userStats,
    loading: isLoading && !userStats,
    error: isError ? (userStatsCollection.utils.lastError as Error).message : null,
    updateUserStats: (updated: UserStats) => userStatsCollection.utils.writeUpdate(updated),
    invalidate: () => userStatsCollection.utils.refetch(),
    addInvestment,
    deleteInvestment,
  };
}
