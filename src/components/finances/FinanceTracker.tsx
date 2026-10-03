import { useState, useMemo, lazy, Suspense, type CSSProperties } from "react";
import type { Transaction } from "@/lib/supabase";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { useSnackVisible } from "@/components/ui/snackbar";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { calculateBudgetInfo } from "./utils";
import { TopTabs } from "@/components/navigation/TopTabs";
import { FINANCE_NAV_ITEMS } from "@/components/navigation/constants";

import { DateFilter } from "./DateFilter";
import { TransactionDialog } from "./TransactionDialog";
import { ExpensesView } from "./ExpensesView";

const InvestmentsView = lazy(() =>
  import("./InvestmentsView").then((m) => ({ default: m.InvestmentsView })),
);
const TrendsView = lazy(() => import("./TrendsView").then((m) => ({ default: m.TrendsView })));

import type { TimeFilter, ActiveView, DateRange } from "./types";
import { filterByTimeRange, sortTransactions, createEmptyTransaction } from "./utils";

function BudgetBar({ budgetInfo }: { budgetInfo: ReturnType<typeof calculateBudgetInfo> }) {
  const formatCurrency = useFormatCurrency();
  const hasBudget = budgetInfo.budget > 0;
  const remaining = budgetInfo.budget - budgetInfo.spent;
  const isOver = hasBudget && remaining < 0;
  const percent = hasBudget ? (budgetInfo.spent / budgetInfo.budget) * 100 : 0;

  return (
    <div className="ui-type sticky top-0 z-30 bg-[var(--ui-page)] px-4 pt-1 pb-3">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-[var(--ui-ink-softer)]">
            {!hasBudget ? "Spent this month" : isOver ? "Over budget" : "Left this month"}
          </span>
          <span
            className={`ui-num text-[14px] ${isOver ? "text-[var(--ui-danger)]" : "text-[var(--ui-ink)]"}`}
          >
            {formatCurrency(hasBudget ? Math.abs(remaining) : budgetInfo.spent)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ui-inset)]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(percent, 100) / 100 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            style={{ transformOrigin: "left" }}
            className={`h-full ${isOver ? "bg-[var(--ui-danger)]" : "bg-[var(--ui-accent)]"}`}
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

export function FinanceTracker({ activeView, onViewChange, onGoHome }: FinanceTrackerProps) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useExpenseData();

  const { userStats } = useUserStats();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("last30");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(null);

  const [dialogState, setDialogState] = useState<DialogState>(null);
  const snackVisible = useSnackVisible();
  const [saving, setSaving] = useState(false);

  const swipeHandlers = useSwipeNavigation({
    views: VIEWS,
    currentView: activeView,
    onViewChange,
  });

  async function saveTransaction(updated: Transaction) {
    if (!dialogState) return;

    setSaving(true);
    const isNew = dialogState.mode === "new";

    try {
      const fields = {
        ...updated,
        merchant: updated.merchant || null,
        details: updated.details || null,
        prorate_months: updated.prorate_months || null,
        bank_account: updated.bank_account || null,
        card_number: updated.card_number || null,
      };
      await (isNew ? addTransaction(fields) : updateTransaction(fields));
      setDialogState(null);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }

  function removeTransaction(txn: Transaction) {
    setDialogState(null);
    deleteTransaction(txn.id).catch((err) => console.error("Failed to delete:", err));
  }

  function openAddExpense() {
    setDialogState({ transaction: createEmptyTransaction(), mode: "new" });
  }

  function handleEditTransaction(txn: Transaction) {
    setDialogState({ transaction: { ...txn }, mode: "edit" });
  }

  function handleDialogChange(updated: Transaction) {
    if (dialogState) {
      setDialogState({ ...dialogState, transaction: updated });
    }
  }

  const filteredTransactions = useMemo(() => {
    const result = filterByTimeRange(transactions, timeFilter, customDateRange);

    return sortTransactions(result, "date", "desc");
  }, [transactions, timeFilter, customDateRange]);

  const budgetInfo = useMemo(() => {
    return calculateBudgetInfo(transactions, userStats?.monthly_budget);
  }, [transactions, userStats?.monthly_budget]);

  return (
    <div className="ui-surface flex h-full flex-col overflow-hidden">
      <header className="relative z-20 shrink-0 bg-[var(--ui-page)]">
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
        className="ui-surface flex-1 touch-pan-y overflow-y-auto overscroll-contain pb-28 md:pb-0"
        {...swipeHandlers}
      >
        {activeView === "expenses" && <BudgetBar budgetInfo={budgetInfo} />}

        <AnimatePresence mode="wait">
          {activeView === "investments" && (
            <motion.div key="investments" {...VIEW_ANIMATION}>
              <Suspense fallback={null}>
                <InvestmentsView />
              </Suspense>
            </motion.div>
          )}
          {activeView === "expenses" && (
            <motion.div key="expenses" {...VIEW_ANIMATION}>
              <ExpensesView
                transactions={filteredTransactions}
                onTransactionClick={handleEditTransaction}
                scrollRef={swipeHandlers.ref}
              />
            </motion.div>
          )}
          {activeView === "trends" && (
            <motion.div key="trends" {...VIEW_ANIMATION}>
              <Suspense fallback={null}>
                <TrendsView transactions={transactions} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TransactionDialog
        transaction={dialogState?.transaction ?? null}
        isNew={dialogState?.mode === "new"}
        saving={saving}
        onClose={() => setDialogState(null)}
        onSave={saveTransaction}
        onChange={handleDialogChange}
        onDelete={removeTransaction}
      />

      <AnimatePresence>
        {activeView === "expenses" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
            className="pointer-events-none fixed inset-x-0 z-40 flex justify-center md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
          >
            <button
              type="button"
              onClick={openAddExpense}
              style={{ "--fab-lift": snackVisible ? "-60px" : "0px" } as CSSProperties}
              className="ui-fab ui-cta pointer-events-auto flex h-14 w-14 items-center justify-center shadow-[0_10px_24px_-10px_oklch(30%_0.12_275/0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)]"
              aria-label="Add expense"
            >
              <Plus className="h-6 w-6" strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
