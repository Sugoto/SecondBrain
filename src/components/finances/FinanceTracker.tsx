import { useState, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency,
  getTransactionBudgetType,
} from "./constants";
import { Input } from "@/components/ui/input";
import { calculateBudgetTypeInfo } from "./utils";
import { TopTabs } from "@/components/navigation/TopTabs";
import { FINANCE_NAV_ITEMS } from "@/components/navigation/constants";

import { DateFilter } from "./DateFilter";
import { TransactionDialog } from "./TransactionDialog";
import { ExpensesView } from "./ExpensesView";
import { InvestmentsView } from "./InvestmentsView";

const TrendsView = lazy(() =>
  import("./TrendsView").then((m) => ({ default: m.TrendsView }))
);

import type { TimeFilter, ActiveView, DateRange } from "./types";
import {
  filterByTimeRange,
  sortTransactions,
  getCategoryTotals,
  getCategoryTotalsByBudgetType,
  createEmptyTransaction,
} from "./utils";

function SegmentedBudgetBar({
  budgetInfo,
  totalExpenses,
  budgetTypeFilter,
  onBudgetTypeFilterChange,
  onUpdateBudgets,
}: {
  budgetInfo: ReturnType<typeof calculateBudgetTypeInfo>;
  theme: "light" | "dark";
  totalExpenses: number;
  budgetTypeFilter: "need" | "want" | null;
  onBudgetTypeFilterChange: (filter: "need" | "want" | null) => void;
  onUpdateBudgets: (needsBudget: number, wantsBudget: number) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingNeeds, setEditingNeeds] = useState("");
  const [editingWants, setEditingWants] = useState("");
  const [saving, setSaving] = useState(false);

  const wantsPercent =
    budgetInfo.wantsBudget > 0
      ? (budgetInfo.wantsSpent / budgetInfo.wantsBudget) * 100
      : 0;

  const needsPercent =
    budgetInfo.needsBudget > 0
      ? (budgetInfo.needsSpent / budgetInfo.needsBudget) * 100
      : 0;

  const startEditing = () => {
    setEditingNeeds(budgetInfo.needsBudget.toString());
    setEditingWants(budgetInfo.wantsBudget.toString());
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingNeeds("");
    setEditingWants("");
  };

  const saveEditing = async () => {
    const newNeeds = parseInt(editingNeeds, 10);
    const newWants = parseInt(editingWants, 10);

    if (isNaN(newNeeds) || isNaN(newWants) || newNeeds < 0 || newWants < 0) {
      toast.error("Please enter valid budget amounts");
      return;
    }

    setSaving(true);
    try {
      await onUpdateBudgets(newNeeds, newWants);
      setIsEditing(false);
      toast.success("Budget updated");
    } catch {
      toast.error("Failed to update budget");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sticky top-0 z-30 px-4 md:px-5 pt-1.5">
      <div className="max-w-6xl mx-auto px-3 py-2 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          {/* Progress bars side by side */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Needs progress bar */}
            <button
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBudgetTypeFilterChange(
                  budgetTypeFilter === "need" ? null : "need"
                );
              }}
              disabled={isEditing}
              className={`w-full space-y-1 transition-all duration-200 rounded-md p-1.5 -m-1.5 ${isEditing
                ? ""
                : budgetTypeFilter === "want"
                  ? "opacity-40"
                  : budgetTypeFilter === "need"
                    ? "bg-accent"
                    : "hover:bg-muted"
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${budgetTypeFilter === "need" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Needs
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-[10px] font-bold text-foreground">
                      {formatCurrency(budgetInfo.needsSpent)}
                    </span>
                    <span className="text-muted-foreground font-bold text-[10px]">/</span>
                    <Input
                      type="number"
                      value={editingNeeds}
                      onChange={(e) => setEditingNeeds(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono font-bold text-right px-1 border border-border rounded"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-foreground">
                    {formatCurrency(budgetInfo.needsSpent)}
                  </span>
                )}
              </div>
              <div className="relative h-2 rounded overflow-hidden bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(needsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.1,
                  }}
                  className="h-full bg-foreground"
                />
              </div>
            </button>

            {/* Wants progress bar */}
            <button
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBudgetTypeFilterChange(
                  budgetTypeFilter === "want" ? null : "want"
                );
              }}
              disabled={isEditing}
              className={`w-full space-y-1 transition-all duration-200 rounded-md p-1.5 -m-1.5 ${isEditing
                ? ""
                : budgetTypeFilter === "need"
                  ? "opacity-40"
                  : budgetTypeFilter === "want"
                    ? "bg-accent"
                    : "hover:bg-muted"
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${budgetTypeFilter === "want" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Wants
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-[10px] font-bold text-foreground">
                      {formatCurrency(budgetInfo.wantsSpent)}
                    </span>
                    <span className="text-muted-foreground font-bold text-[10px]">/</span>
                    <Input
                      type="number"
                      value={editingWants}
                      onChange={(e) => setEditingWants(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono font-bold text-right px-1 border border-border rounded"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-foreground">
                    {formatCurrency(budgetInfo.wantsSpent)}
                  </span>
                )}
              </div>
              <div className="relative h-2 rounded overflow-hidden bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(wantsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2,
                  }}
                  className="h-full bg-foreground"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Total Expenses row with edit button */}
        <div className="flex items-center justify-between pt-1.5 mt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="font-mono text-xs font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={saveEditing}
                disabled={saving}
                className="h-5 w-5 rounded-lg flex items-center justify-center bg-muted border border-border text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                title="Save"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="h-5 w-5 rounded-lg flex items-center justify-center bg-muted border border-border text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                title="Cancel"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="h-5 w-5 rounded-lg flex items-center justify-center bg-muted border border-border text-foreground transition-colors hover:bg-accent"
              title="Edit Budget"
            >
              <Pencil className="h-2.5 w-2.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const VIEWS = ["investments", "expenses", "trends"] as const;

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

type DialogState = {
  transaction: Transaction;
  mode: "new" | "edit";
} | null;

interface FinanceTrackerProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onGoHome: () => void;
}

export function FinanceTracker({
  activeView,
  onViewChange,
  onGoHome,
}: FinanceTrackerProps) {
  const { transactions, addToCache, updateInCache, removeFromCache } =
    useExpenseData();

  const { userStats, updateUserStats } = useUserStats();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(null);
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<
    "need" | "want" | null
  >(null);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { theme } = useTheme();

  const swipeHandlers = useSwipeNavigation({
    views: VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  async function saveTransaction(updated: Transaction) {
    if (!dialogState) return;

    setSaving(true);
    const isNew = dialogState.mode === "new";

    try {
      if (isNew) {
        const { data, error: insertError } = await supabase
          .from("transactions")
          .insert({
            amount: updated.amount,
            merchant: updated.merchant || null,
            date: updated.date,
            time: updated.time,
            category: updated.category || null,
            excluded_from_budget: updated.excluded_from_budget,
            details: updated.details || null,
            prorate_months: updated.prorate_months || null,
            budget_type: updated.budget_type,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) {
          addToCache(data);
        }
        toast.success("Expense added successfully");
      } else {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            amount: updated.amount,
            merchant: updated.merchant,
            date: updated.date,
            time: updated.time,
            category: updated.category,
            excluded_from_budget: updated.excluded_from_budget,
            details: updated.details,
            prorate_months: updated.prorate_months || null,
            budget_type: updated.budget_type,
          })
          .eq("id", updated.id);

        if (updateError) throw updateError;
        updateInCache(updated);
        toast.success("Transaction updated");
      }
      setDialogState(null);
    } catch (err) {
      console.error("Failed to save:", err);
      toast.error(
        isNew ? "Failed to add expense" : "Failed to update transaction"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(txn: Transaction) {
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", txn.id);

      if (deleteError) throw deleteError;
      removeFromCache(txn.id);
      toast.success("Transaction deleted");
      setDialogState(null);
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete transaction");
    } finally {
      setDeleting(false);
    }
  }

  function openAddExpense() {
    setDialogState({
      transaction: createEmptyTransaction(),
      mode: "new",
    });
  }

  function handleEditTransaction(txn: Transaction) {
    setDialogState({
      transaction: { ...txn },
      mode: "edit",
    });
  }

  function handleDialogChange(updated: Transaction) {
    if (dialogState) {
      setDialogState({ ...dialogState, transaction: updated });
    }
  }

  const filteredTransactions = useMemo(() => {
    const disableProrationSpreading = !budgetTypeFilter;
    
    let result = filterByTimeRange(
      transactions,
      timeFilter,
      customDateRange,
      { disableProrationSpreading }
    );

    if (budgetTypeFilter) {
      result = result.filter((t) => {
        const txnBudgetType = getTransactionBudgetType(
          t.category,
          t.budget_type
        );
        return txnBudgetType === budgetTypeFilter;
      });
    }

    return sortTransactions(result, "date", "desc");
  }, [transactions, timeFilter, customDateRange, budgetTypeFilter]);

  const categoryTotals = useMemo(
    () =>
      getCategoryTotals(transactions, timeFilter, {
        customRange: customDateRange,
        disableProrationSpreading: true,
      }),
    [transactions, timeFilter, customDateRange]
  );

  const categoryTotalsByBudgetType = useMemo(
    () =>
      getCategoryTotalsByBudgetType(transactions, timeFilter, {
        excludeBudgetExcluded: true,
        customRange: customDateRange,
        disableProrationSpreading: true,
      }),
    [transactions, timeFilter, customDateRange]
  );

  const budgetTypeInfo = useMemo(() => {
    return calculateBudgetTypeInfo(
      transactions,
      userStats?.needs_budget,
      userStats?.wants_budget
    );
  }, [transactions, userStats?.needs_budget, userStats?.wants_budget]);

  const totalExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthTransactions = filterByTimeRange(
      transactions,
      timeFilter,
      customDateRange,
      { disableProrationSpreading: true }
    );
    
    return monthTransactions
      .filter((t) => {
        if (t.excluded_from_budget) return false;
        const txnDate = new Date(t.date);
        return txnDate >= startOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, timeFilter, customDateRange]);

  const handleUpdateBudgets = async (
    needsBudget: number,
    wantsBudget: number
  ) => {
    if (!userStats?.id) throw new Error("No user stats");

    const { error: updateError } = await supabase
      .from("user_stats")
      .update({ needs_budget: needsBudget, wants_budget: wantsBudget })
      .eq("id", userStats.id);

    if (updateError) throw updateError;

    updateUserStats({
      ...userStats,
      needs_budget: needsBudget,
      wants_budget: wantsBudget,
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <header className="md:shrink-0 md:relative fixed top-0 left-0 right-0 z-20 vercel-header pb-3">
        <div className="max-w-6xl mx-auto">
          <TopTabs
            navItems={FINANCE_NAV_ITEMS}
            activeView={activeView}
            onViewChange={(view) => onViewChange(view as ActiveView)}
            onGoHome={onGoHome}
            title="Finances"
            rightContent={
              activeView !== "investments" ? (
                <DateFilter
                  activeView={activeView}
                  timeFilter={timeFilter}
                  customDateRange={customDateRange}
                  onTimeFilterChange={setTimeFilter}
                  onCustomDateRangeChange={setCustomDateRange}
                />
              ) : undefined
            }
          />
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-4 md:pb-0 pt-[88px] md:pt-0"
        {...swipeHandlers}
      >
        {activeView === "expenses" && (
          <SegmentedBudgetBar
            budgetInfo={budgetTypeInfo}
            theme={theme}
            totalExpenses={totalExpenses}
            budgetTypeFilter={budgetTypeFilter}
            onBudgetTypeFilterChange={setBudgetTypeFilter}
            onUpdateBudgets={handleUpdateBudgets}
          />
        )}

        <AnimatePresence mode="wait">
          {activeView === "investments" && (
            <motion.div key="investments" {...VIEW_ANIMATION}>
              <InvestmentsView />
            </motion.div>
          )}
          {activeView === "expenses" && (
            <motion.div key="expenses" {...VIEW_ANIMATION}>
              <ExpensesView
                transactions={filteredTransactions}
                onTransactionClick={handleEditTransaction}
              />
            </motion.div>
          )}
          {activeView === "trends" && (
            <motion.div key="trends" {...VIEW_ANIMATION}>
              <Suspense fallback={null}>
                <TrendsView
                  categoryTotals={categoryTotals}
                  categoryTotalsByBudgetType={categoryTotalsByBudgetType}
                  expandedCategory={expandedCategory}
                  onToggleCategory={setExpandedCategory}
                  onTransactionClick={handleEditTransaction}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TransactionDialog
        transaction={dialogState?.transaction ?? null}
        isNew={dialogState?.mode === "new"}
        saving={saving}
        deleting={deleting}
        onClose={() => setDialogState(null)}
        onSave={saveTransaction}
        onChange={handleDialogChange}
        onDelete={deleteTransaction}
      />

      {/* Mobile FAB */}
      <AnimatePresence>
        {activeView === "expenses" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddExpense}
            className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-11 w-11 rounded-full bg-foreground text-background shadow-lg"
            aria-label="Add expense"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
