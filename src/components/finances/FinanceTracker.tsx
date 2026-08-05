import { useState, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { calculateBudgetInfo } from "./utils";
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
  getValueRatingTotals,
  createEmptyTransaction,
} from "./utils";

function BudgetBar({
  budgetInfo,
}: {
  budgetInfo: ReturnType<typeof calculateBudgetInfo>;
}) {
  const formatCurrency = useFormatCurrency();
  const hasBudget = budgetInfo.budget > 0;
  const remaining = budgetInfo.budget - budgetInfo.spent;
  const isOver = hasBudget && remaining < 0;
  const percent = hasBudget ? (budgetInfo.spent / budgetInfo.budget) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 bg-background border-y border-zinc-300 dark:border-zinc-700">
      <div className="max-w-6xl mx-auto px-6 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Budget
          </span>
          <span
            className={`font-mono tabular-nums text-[12px] ${
              isOver ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatCurrency(hasBudget ? Math.abs(remaining) : budgetInfo.spent)}
            <span className="ml-1 font-sans text-[9px] uppercase tracking-wider">
              {!hasBudget ? "spent" : isOver ? "over" : "left"}
            </span>
          </span>
        </div>
        <div className="h-[2px] rounded-full overflow-hidden bg-outline-variant/40">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(percent, 100) / 100 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            style={{ transformOrigin: "left" }}
            className={`h-full ${isOver ? "bg-destructive" : "bg-foreground"}`}
          />
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

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
            value_rating: updated.value_rating,
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
      } else {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            amount: updated.amount,
            merchant: updated.merchant,
            date: updated.date,
            time: updated.time,
            value_rating: updated.value_rating,
            excluded_from_budget: updated.excluded_from_budget,
            details: updated.details,
            prorate_months: updated.prorate_months || null,
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
    const result = filterByTimeRange(
      transactions,
      timeFilter,
      customDateRange,
      { disableProrationSpreading: true }
    );

    return sortTransactions(result, "date", "desc");
  }, [transactions, timeFilter, customDateRange]);

  const valueRatingTotals = useMemo(
    () =>
      getValueRatingTotals(transactions, timeFilter, {
        excludeBudgetExcluded: true,
        customRange: customDateRange,
        disableProrationSpreading: true,
      }),
    [transactions, timeFilter, customDateRange]
  );

  const budgetInfo = useMemo(() => {
    return calculateBudgetInfo(transactions, userStats?.monthly_budget);
  }, [transactions, userStats?.monthly_budget]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <header className="md:shrink-0 md:relative fixed top-0 left-0 right-0 z-20 bg-background border-b border-zinc-300 dark:border-zinc-700">
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
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-28 md:pb-0 pt-[112px] md:pt-0"
        {...swipeHandlers}
      >
        {activeView === "expenses" && <BudgetBar budgetInfo={budgetInfo} />}

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
                  valueRatingTotals={valueRatingTotals}
                  expandedGroup={expandedGroup}
                  onToggleGroup={setExpandedGroup}
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
            className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20"
            aria-label="Add expense"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
