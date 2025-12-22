import { useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData } from "@/hooks/useExpenseData";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, MONTHLY_BUDGET } from "./constants";
import { calculateBudgetInfo } from "./utils";

import { Header } from "./Header";
import { DynamicBottomNav } from "@/components/navigation/DynamicBottomNav";
import { FINANCE_NAV_ITEMS } from "@/components/navigation/constants";
import { TransactionDialog } from "./TransactionDialog";
import { ExpensesView } from "./ExpensesView";
import { TrendsView } from "./TrendsView";
import { InvestmentsView } from "./InvestmentsView";

import type { TimeFilter, ActiveView, ChartMode, DateRange } from "./types";
import {
  filterByTimeRange,
  sortTransactions,
  getCategoryTotals,
  createEmptyTransaction,
  getMonthlyAmount,
} from "./utils";

function BudgetProgressBar({
  monthlyBudgetExpenses,
  theme,
}: {
  monthlyBudgetExpenses: number;
  theme: "light" | "dark";
}) {
  const [showDailySpent, setShowDailySpent] = useState(false);
  const [showDailyRemaining, setShowDailyRemaining] = useState(false);

  const { dailyBudget, totalRemaining, percentUsed } = calculateBudgetInfo(
    monthlyBudgetExpenses,
    MONTHLY_BUDGET
  );

  const currentDay = new Date().getDate();
  const dailySpent = currentDay > 0 ? monthlyBudgetExpenses / currentDay : 0;

  return (
    <div className="sticky top-0 z-30 px-4 md:px-6 pt-3">
      <div
        className="max-w-6xl mx-auto px-4 py-3 rounded-2xl space-y-2"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(24, 24, 27, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow:
            theme === "dark"
              ? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)"
              : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          border:
            theme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowDailySpent((prev) => !prev)}
            className="flex items-center hover:opacity-80 transition-opacity active:scale-95"
            title="Tap to toggle daily/total"
          >
            <span className="text-muted-foreground">Spent</span>
            <div className="relative overflow-hidden min-w-[70px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={showDailySpent ? "daily-spent" : "total-spent"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="font-mono font-bold text-expense block"
                >
                  {showDailySpent
                    ? `${formatCurrency(dailySpent)}/day`
                    : formatCurrency(monthlyBudgetExpenses)}
                </motion.span>
              </AnimatePresence>
            </div>
          </button>
          <button
            onClick={() => setShowDailyRemaining((prev) => !prev)}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity active:scale-95"
            title="Tap to toggle daily/total"
          >
            <div className="relative overflow-hidden min-w-[70px] text-right">
              <AnimatePresence mode="wait">
                <motion.span
                  key={
                    showDailyRemaining ? "daily-remaining" : "total-remaining"
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`font-mono font-bold block ${
                    totalRemaining <= 0 ? "text-red-500" : "text-income"
                  }`}
                >
                  {showDailyRemaining
                    ? `${formatCurrency(dailyBudget)}/day`
                    : formatCurrency(totalRemaining)}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-muted-foreground">remaining</span>
          </button>
        </div>
        <div className="relative h-3.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentUsed)}%` }}
            transition={{
              duration: 1,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2,
            }}
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background:
                percentUsed > 90
                  ? "linear-gradient(90deg, #dc2626 0%, #f87171 100%)"
                  : percentUsed > 75
                  ? "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)"
                  : "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%)",
              }}
            />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-foreground/70"
          >
            {percentUsed.toFixed(0)}%
          </motion.span>
        </div>
      </div>
    </div>
  );
}

// Constants outside component to avoid recreation
const VIEWS: ActiveView[] = ["investments", "expenses", "trends"];
const MIN_SWIPE_DISTANCE = 100;

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
  onGoHome?: () => void;
}

export function FinanceTracker({ onGoHome }: FinanceTrackerProps) {
  // Data from React Query cache
  const {
    transactions,
    loading,
    error,
    addToCache,
    updateInCache,
    removeFromCache,
  } = useExpenseData();

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(null);

  // UI state
  const [activeView, setActiveView] = useState<ActiveView>("expenses");
  const [chartMode, setChartMode] = useState<ChartMode>("daily");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Dialog state - consolidated
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { theme } = useTheme();

  // Swipe navigation for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    const currentIndex = VIEWS.indexOf(activeView);

    if (isLeftSwipe && currentIndex < VIEWS.length - 1) {
      setActiveView(VIEWS[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      setActiveView(VIEWS[currentIndex - 1]);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeView]);

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
            type: "expense",
            category: updated.category || null,
            excluded_from_budget: updated.excluded_from_budget,
            details: updated.details || null,
            prorate_months: updated.prorate_months || null,
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
    const result = filterByTimeRange(transactions, timeFilter, customDateRange);
    return sortTransactions(result, "date", "desc");
  }, [transactions, timeFilter, customDateRange]);

  // Category totals for display (includes all transactions)
  const categoryTotals = useMemo(
    () =>
      getCategoryTotals(transactions, timeFilter, {
        customRange: customDateRange,
      }),
    [transactions, timeFilter, customDateRange]
  );

  // Category totals for summary (excludes budget-excluded, uses prorated amounts)
  const summaryCategoryTotals = useMemo(
    () =>
      getCategoryTotals(transactions, timeFilter, {
        excludeBudgetExcluded: true,
        customRange: customDateRange,
      }),
    [transactions, timeFilter, customDateRange]
  );

  // Monthly budget expenses - always uses "month" filter regardless of selected time filter
  const monthlyBudgetExpenses = useMemo(() => {
    const monthlyTransactions = filterByTimeRange(transactions, "month");
    return monthlyTransactions
      .filter((t) => t.type === "expense" && !t.excluded_from_budget)
      .reduce((sum, t) => sum + getMonthlyAmount(t), 0);
  }, [transactions]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      {/* Header - Fixed on mobile */}
      <header className="md:shrink-0 md:relative fixed top-0 left-0 right-0 bg-background z-20">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Header
            error={error}
            activeView={activeView}
            timeFilter={timeFilter}
            chartMode={chartMode}
            customDateRange={customDateRange}
            onAddExpense={openAddExpense}
            onTimeFilterChange={setTimeFilter}
            onChartModeChange={setChartMode}
            onCustomDateRangeChange={setCustomDateRange}
          />
        </div>
      </header>

      {/* Main Content - with top padding for fixed header on mobile */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-20 md:pb-0 pt-[72px] md:pt-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sticky Budget Progress Bar - only on expenses view */}
        {activeView === "expenses" && (
          <BudgetProgressBar
            monthlyBudgetExpenses={monthlyBudgetExpenses}
            theme={theme}
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
              <TrendsView
                transactions={transactions}
                chartMode={chartMode}
                categoryTotals={categoryTotals}
                chartCategoryTotals={summaryCategoryTotals}
                expandedCategory={expandedCategory}
                onToggleCategory={setExpandedCategory}
                onTransactionClick={handleEditTransaction}
              />
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

      {/* Mobile FAB - only on expenses view */}
      <AnimatePresence>
        {activeView === "expenses" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={openAddExpense}
            className="group md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-14 w-14 rounded-full overflow-hidden"
            style={{
              background:
                theme === "dark"
                  ? "rgba(24, 24, 27, 0.6)"
                  : "rgba(255, 255, 255, 0.6)",
              boxShadow:
                theme === "dark"
                  ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)"
                  : "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.2)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border:
                theme === "dark"
                  ? "1px solid rgba(139, 92, 246, 0.4)"
                  : "1px solid rgba(139, 92, 246, 0.3)",
            }}
            aria-label="Add expense"
          >
            {/* Glass shine effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
              }}
            />
            {/* Static ring - hover effect instead of infinite animation */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-shadow duration-300 group-hover:shadow-[0_0_0_4px_rgba(139,92,246,0.2)]"
            />
            <Plus className="h-6 w-6 text-primary relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <DynamicBottomNav
        activeView={activeView}
        navItems={FINANCE_NAV_ITEMS}
        onViewChange={(view) => setActiveView(view as ActiveView)}
        onGoHome={onGoHome}
      />
    </div>
  );
}
