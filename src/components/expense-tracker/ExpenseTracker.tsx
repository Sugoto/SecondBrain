import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";

// Local components
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { BottomNav } from "./BottomNav";
import { TransactionDialog } from "./TransactionDialog";
import { ExpensesView } from "./ExpensesView";
import { CategoriesView } from "./CategoriesView";
import { TrendsView } from "./TrendsView";

// Utils and types
import type { TimeFilter, ActiveView, ChartMode, DateRange } from "./types";
import {
  filterByTimeRange,
  sortTransactions,
  getCategoryTotals,
  createEmptyTransaction,
  getMonthlyAmount,
} from "./utils";

// Constants outside component to avoid recreation
const VIEWS: ActiveView[] = ["trends", "expenses", "categories"];
const MIN_SWIPE_DISTANCE = 50;

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

export function ExpenseTracker() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const { theme, toggle: toggleTheme } = useTheme();

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

  // Fetch transactions - wrapped in useCallback
  const fetchTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(500);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function saveTransaction(updated: Transaction) {
    if (!dialogState) return;

    setSaving(true);
    const isNew = dialogState.mode === "new";

    try {
      if (isNew) {
        const { data, error } = await supabase
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

        if (error) throw error;
        if (data) {
          setTransactions((prev) => [data, ...prev]);
        }
        toast.success("Expense added successfully");
      } else {
        const { error } = await supabase
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

        if (error) throw error;
        setTransactions((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
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
    () => getCategoryTotals(transactions, timeFilter, { customRange: customDateRange }),
    [transactions, timeFilter, customDateRange]
  );

  // Category totals for summary (excludes budget-excluded, uses prorated amounts)
  const summaryCategoryTotals = useMemo(
    () => getCategoryTotals(transactions, timeFilter, { excludeBudgetExcluded: true, customRange: customDateRange }),
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
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
          <Header
            totalExpenses={monthlyBudgetExpenses}
            theme={theme}
            error={error}
            refreshing={refreshing}
            onToggleTheme={toggleTheme}
            onRefresh={() => fetchTransactions(true)}
            onAddExpense={openAddExpense}
          />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <FilterBar
              activeView={activeView}
              timeFilter={timeFilter}
              chartMode={chartMode}
              customDateRange={customDateRange}
              onTimeFilterChange={setTimeFilter}
              onChartModeChange={setChartMode}
              onCustomDateRangeChange={setCustomDateRange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-20 md:pb-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeView === "trends" && (
            <motion.div key="trends" {...VIEW_ANIMATION}>
              <TrendsView transactions={transactions} chartMode={chartMode} />
            </motion.div>
          )}
          {activeView === "expenses" && (
            <motion.div key="expenses" {...VIEW_ANIMATION}>
              <ExpensesView
                transactions={filteredTransactions}
                summaryCategoryTotals={summaryCategoryTotals}
                timeFilter={timeFilter}
                onTransactionClick={handleEditTransaction}
              />
            </motion.div>
          )}
          {activeView === "categories" && (
            <motion.div key="categories" {...VIEW_ANIMATION}>
              <CategoriesView
                categoryTotals={categoryTotals}
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
        onClose={() => setDialogState(null)}
        onSave={saveTransaction}
        onChange={handleDialogChange}
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
            className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center h-14 w-14 rounded-full overflow-hidden"
            style={{
              background: theme === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)"
                : "linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(59, 130, 246, 1) 100%)",
              boxShadow: theme === "dark"
                ? "0 8px 32px rgba(139, 92, 246, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                : "0 8px 32px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            aria-label="Add expense"
          >
            {/* Glass shine effect */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)",
              }}
            />
            {/* Animated ring */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ 
                boxShadow: [
                  "0 0 0 0px rgba(139, 92, 246, 0.4)",
                  "0 0 0 8px rgba(139, 92, 246, 0)",
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <Plus className="h-6 w-6 text-white relative z-10 drop-shadow-sm" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
