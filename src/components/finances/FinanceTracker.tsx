import { useState, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import {
  getTransactionBudgetType,
  EXCLUDED_CATEGORIES,
} from "./constants";
import { useFormatCurrency } from "@/hooks/usePrivacy";
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
}: {
  budgetInfo: ReturnType<typeof calculateBudgetTypeInfo>;
  totalExpenses: number;
  budgetTypeFilter: "need" | "want" | null;
  onBudgetTypeFilterChange: (filter: "need" | "want" | null) => void;
}) {
  const formatCurrency = useFormatCurrency();
  const wantsPercent =
    budgetInfo.wantsBudget > 0
      ? (budgetInfo.wantsSpent / budgetInfo.wantsBudget) * 100
      : 0;

  const needsPercent =
    budgetInfo.needsBudget > 0
      ? (budgetInfo.needsSpent / budgetInfo.needsBudget) * 100
      : 0;

  return (
    <div className="sticky top-0 z-30 px-4 md:px-5 pt-1.5">
      <div className="max-w-6xl mx-auto p-2 rounded-xl bg-surface-container-low border border-outline-variant">
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBudgetTypeFilterChange(budgetTypeFilter === "need" ? null : "need");
            }}
            className={`w-full space-y-1 rounded-lg p-1.5 transition-colors ${
              budgetTypeFilter === "want"
                ? "opacity-40"
                : budgetTypeFilter === "need"
                  ? "bg-secondary-container"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-label-s text-foreground">Needs</span>
              <span className="font-mono text-label-s text-foreground">
                {formatCurrency(budgetInfo.needsSpent)}
              </span>
            </div>
            <div className="relative h-1 rounded-full overflow-hidden bg-surface-container">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(needsPercent, 100) / 100 }}
                transition={{ type: "spring", stiffness: 380, damping: 27 }}
                style={{ transformOrigin: "left" }}
                className="h-full bg-primary"
              />
            </div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBudgetTypeFilterChange(budgetTypeFilter === "want" ? null : "want");
            }}
            className={`w-full space-y-1 rounded-lg p-1.5 transition-colors ${
              budgetTypeFilter === "need"
                ? "opacity-40"
                : budgetTypeFilter === "want"
                  ? "bg-tertiary-container"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-label-s text-foreground">Wants</span>
              <span className="font-mono text-label-s text-foreground">
                {formatCurrency(budgetInfo.wantsSpent)}
              </span>
            </div>
            <div className="relative h-1 rounded-full overflow-hidden bg-surface-container">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(wantsPercent, 100) / 100 }}
                transition={{ type: "spring", stiffness: 380, damping: 27, delay: 0.05 }}
                style={{ transformOrigin: "left" }}
                className="h-full bg-tertiary"
              />
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between px-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-label-s text-muted-foreground">Total</span>
            <span className="font-mono text-label-m text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-s text-muted-foreground">Budgeted</span>
            <span className="font-mono text-label-m text-foreground">
              {formatCurrency(budgetInfo.needsSpent + budgetInfo.wantsSpent)}
            </span>
          </div>
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

  const { userStats } = useUserStats();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(null);
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<
    "need" | "want" | null
  >(null);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      }
      setDialogState(null);
    } catch (err) {
      console.error("Failed to save:", err);
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
      setDialogState(null);
    } catch (err) {
      console.error("Failed to delete:", err);
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
        if (t.category && EXCLUDED_CATEGORIES.includes(t.category)) return false;
        const txnDate = new Date(t.date);
        return txnDate >= startOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, timeFilter, customDateRange]);

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
            totalExpenses={totalExpenses}
            budgetTypeFilter={budgetTypeFilter}
            onBudgetTypeFilterChange={setBudgetTypeFilter}
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

      <AnimatePresence>
        {activeView === "expenses" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 700, damping: 32 }}
            whileTap={{ scale: 0.92 }}
            onClick={openAddExpense}
            className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-container text-on-primary-container"
            aria-label="Add expense"
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
