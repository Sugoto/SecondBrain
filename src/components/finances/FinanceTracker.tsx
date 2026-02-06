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

// Lazy load TrendsView since it imports heavy Recharts (~420KB)
const TrendsView = lazy(() =>
  import("./TrendsView").then((m) => ({ default: m.TrendsView }))
);

import type { TimeFilter, ActiveView, ChartMode, DateRange } from "./types";
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

  // Wants progress
  const wantsPercent =
    budgetInfo.wantsBudget > 0
      ? (budgetInfo.wantsSpent / budgetInfo.wantsBudget) * 100
      : 0;

  // Needs progress
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
      <div className="max-w-6xl mx-auto px-3 py-2 rounded-lg border-[1.5px] border-black dark:border-white bg-pastel-green shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
        <div className="flex items-center gap-2">
          {/* Progress bars side by side - tappable to filter */}
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
                    ? "bg-white/40 dark:bg-black/20"
                    : "hover:bg-white/30 dark:hover:bg-black/10"
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${budgetTypeFilter === "need" ? "text-black dark:text-white" : "text-black/70 dark:text-white/70"}`}
                >
                  Needs
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-[10px] font-bold text-black dark:text-white">
                      {formatCurrency(budgetInfo.needsSpent)}
                    </span>
                    <span className="text-black/50 dark:text-white/50 font-bold text-[10px]">/</span>
                    <Input
                      type="number"
                      value={editingNeeds}
                      onChange={(e) => setEditingNeeds(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono font-bold text-right px-1 border-[1.5px] border-black dark:border-white rounded"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-black dark:text-white">
                    {formatCurrency(budgetInfo.needsSpent)}
                  </span>
                )}
              </div>
              <div className="relative h-2 rounded overflow-hidden bg-white dark:bg-black/30 border-[1.5px] border-black dark:border-white">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(needsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.1,
                  }}
                  className="h-full bg-black dark:bg-white"
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
                    ? "bg-white/40 dark:bg-black/20"
                    : "hover:bg-white/30 dark:hover:bg-black/10"
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${budgetTypeFilter === "want" ? "text-black dark:text-white" : "text-black/70 dark:text-white/70"}`}
                >
                  Wants
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-[10px] font-bold text-black dark:text-white">
                      {formatCurrency(budgetInfo.wantsSpent)}
                    </span>
                    <span className="text-black/50 dark:text-white/50 font-bold text-[10px]">/</span>
                    <Input
                      type="number"
                      value={editingWants}
                      onChange={(e) => setEditingWants(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono font-bold text-right px-1 border-[1.5px] border-black dark:border-white rounded"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-black dark:text-white">
                    {formatCurrency(budgetInfo.wantsSpent)}
                  </span>
                )}
              </div>
              <div className="relative h-2 rounded overflow-hidden bg-white dark:bg-black/30 border-[1.5px] border-black dark:border-white">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(wantsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2,
                  }}
                  className="h-full bg-black dark:bg-white"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Total Expenses row with edit button */}
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-black/20 dark:border-white/20">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-black/70 dark:text-white/70">Total</span>
            <span className="font-mono text-xs font-bold text-black dark:text-white">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={saveEditing}
                disabled={saving}
                className="h-5 w-5 rounded flex items-center justify-center bg-pastel-blue border-[1.5px] border-black dark:border-white text-black dark:text-white transition-all shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
                title="Save"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="h-5 w-5 rounded flex items-center justify-center bg-pastel-pink border-[1.5px] border-black dark:border-white text-black dark:text-white transition-all shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
                title="Cancel"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="h-5 w-5 rounded flex items-center justify-center bg-white dark:bg-white/10 border-[1.5px] border-black dark:border-white text-black dark:text-white transition-all shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] hover:bg-pastel-yellow active:translate-x-0 active:translate-y-0 active:shadow-none"
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

// Constants outside component to avoid recreation
const VIEWS = ["investments", "expenses", "trends"] as const;

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

// Dialog state type
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
  // Data from React Query cache
  const { transactions, addToCache, updateInCache, removeFromCache } =
    useExpenseData();

  // User stats for budget values
  const { userStats, updateUserStats } = useUserStats();

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(null);
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<
    "need" | "want" | null
  >(null);

  // UI state
  const [chartMode, setChartMode] = useState<ChartMode>("daily");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Dialog state - consolidated
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { theme } = useTheme();

  // Swipe navigation for mobile (no View Transitions - Framer Motion handles animations)
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
      // Don't close dialog on error - let user retry
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

  // Derived data
  const filteredTransactions = useMemo(() => {
    // When filtering by budget type (needs/wants), include past prorations
    // Otherwise, only show transactions from the actual selected period
    const disableProrationSpreading = !budgetTypeFilter;
    
    let result = filterByTimeRange(
      transactions,
      timeFilter,
      customDateRange,
      { disableProrationSpreading }
    );

    // Apply budget type filter if active
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

  // Category totals for display (includes all transactions)
  // Proration spreading is disabled - only show transactions from the actual selected period
  const categoryTotals = useMemo(
    () =>
      getCategoryTotals(transactions, timeFilter, {
        customRange: customDateRange,
        disableProrationSpreading: true,
      }),
    [transactions, timeFilter, customDateRange]
  );

  // Category totals grouped by budget type (considers manual overrides)
  // Proration spreading is disabled - only show transactions from the actual selected period
  const categoryTotalsByBudgetType = useMemo(
    () =>
      getCategoryTotalsByBudgetType(transactions, timeFilter, {
        excludeBudgetExcluded: true,
        customRange: customDateRange,
        disableProrationSpreading: true,
      }),
    [transactions, timeFilter, customDateRange]
  );

  // Budget type info - calculates needs vs wants spending for current month
  const budgetTypeInfo = useMemo(() => {
    return calculateBudgetTypeInfo(
      transactions,
      userStats?.needs_budget,
      userStats?.wants_budget
    );
  }, [transactions, userStats?.needs_budget, userStats?.wants_budget]);

  // Total expenses for current month only - full amount for purchases made this month
  // (excludes past prorations from previous months, includes future prorations from this month)
  const totalExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return filteredTransactions
      .filter((t) => {
        if (t.excluded_from_budget) return false;
        // Only include transactions actually made this month
        const txnDate = new Date(t.date);
        return txnDate >= startOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0); // Full amount, not prorated
  }, [filteredTransactions]);

  // Handler to update budget values
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

    // Update local cache
    updateUserStats({
      ...userStats,
      needs_budget: needsBudget,
      wants_budget: wantsBudget,
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      {/* Header with TopTabs - Fixed on mobile */}
      <header className="md:shrink-0 md:relative fixed top-0 left-0 right-0 z-20 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Top Tabs Navigation with Date Filter */}
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
                  chartMode={chartMode}
                  customDateRange={customDateRange}
                  onTimeFilterChange={setTimeFilter}
                  onChartModeChange={setChartMode}
                  onCustomDateRangeChange={setCustomDateRange}
                />
              ) : undefined
            }
          />
        </div>
      </header>

      {/* Main Content - with top padding for fixed header with tabs on mobile */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-4 md:pb-0 pt-[88px] md:pt-0"
        {...swipeHandlers}
      >
        {/* Sticky Segmented Budget Bar - only on expenses view */}
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
                  transactions={transactions}
                  chartMode={chartMode}
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

      {/* Transaction Dialog */}
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

      {/* Mobile FAB - Neo-brutalism style (compact) */}
      <AnimatePresence>
        {activeView === "expenses" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddExpense}
            className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-11 w-11 rounded-lg bg-pastel-pink border-[1.5px] border-black dark:border-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
            aria-label="Add expense"
          >
            <Plus className="h-5 w-5 text-black dark:text-white" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
