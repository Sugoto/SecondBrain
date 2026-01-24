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
  BUDGET_TYPE_CONFIG,
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
  theme,
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

  const needsConfig = BUDGET_TYPE_CONFIG.need;

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

  const isDark = theme === "dark";
  
  return (
    <div className="sticky top-0 z-30 px-4 md:px-6 pt-2">
      <div
        className="max-w-6xl mx-auto px-3 py-2 rounded-lg relative overflow-hidden"
        style={{
          // Parchment background for budget bar
          background: isDark
            ? `linear-gradient(145deg, rgba(45, 35, 25, 0.95) 0%, rgba(35, 28, 20, 0.95) 100%)`
            : `linear-gradient(145deg, #f5e6c8 0%, #e8d4b0 100%)`,
          border: isDark
            ? "2px solid #5d4530"
            : "2px solid #c9a66b",
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0, 0, 0, 0.4)"
            : "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Subtle paper texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
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
              className={`w-full space-y-0.5 transition-all duration-200 rounded-md p-1 -m-1 ${
                isEditing
                  ? ""
                  : budgetTypeFilter === "want"
                  ? "opacity-40"
                  : "hover:opacity-80"
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span
                  className={`font-medium ${
                    budgetTypeFilter === "need" ? "" : "text-muted-foreground"
                  }`}
                  style={{
                    color:
                      budgetTypeFilter === "need"
                        ? needsConfig.color
                        : undefined,
                  }}
                >
                  Needs
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span
                      className="font-mono font-medium"
                      style={{ color: needsConfig.color }}
                    >
                      {formatCurrency(budgetInfo.needsSpent)}
                    </span>
                    <span className="text-muted-foreground/50">/</span>
                    <Input
                      type="number"
                      value={editingNeeds}
                      onChange={(e) => setEditingNeeds(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono text-right px-1"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span
                    className="font-mono font-medium"
                    style={{ color: needsConfig.color }}
                  >
                    {formatCurrency(budgetInfo.needsSpent)}
                  </span>
                )}
              </div>
              <div
                className="relative h-2 rounded-full overflow-hidden"
                style={{
                  background:
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(needsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.1,
                  }}
                  className="h-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${needsConfig.color} 0%, ${needsConfig.color}cc 100%)`,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)",
                    }}
                  />
                </motion.div>
              </div>
            </button>

            {/* Wants progress bar - Purple gradient */}
            <button
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBudgetTypeFilterChange(
                  budgetTypeFilter === "want" ? null : "want"
                );
              }}
              disabled={isEditing}
              className={`w-full space-y-0.5 transition-all duration-200 rounded-md p-1 -m-1 ${
                isEditing
                  ? ""
                  : budgetTypeFilter === "need"
                  ? "opacity-40"
                  : "hover:opacity-80"
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span
                  className={`font-medium ${
                    budgetTypeFilter === "want"
                      ? "text-purple-500"
                      : "text-muted-foreground"
                  }`}
                >
                  Wants
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono font-medium text-purple-500">
                      {formatCurrency(budgetInfo.wantsSpent)}
                    </span>
                    <span className="text-muted-foreground/50">/</span>
                    <Input
                      type="number"
                      value={editingWants}
                      onChange={(e) => setEditingWants(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-14 text-[9px] font-mono text-right px-1"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <span className="font-mono font-medium text-purple-500">
                    {formatCurrency(budgetInfo.wantsSpent)}
                  </span>
                )}
              </div>
              <div
                className="relative h-2 rounded-full overflow-hidden"
                style={{
                  background:
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(wantsPercent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2,
                  }}
                  className="h-full relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
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
              </div>
            </button>
          </div>
        </div>

        {/* Total Expenses row with edit button */}
        <div className="flex items-center justify-between pt-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-semibold" style={{ color: "#ef4444" }}>
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={saveEditing}
                disabled={saving}
                className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
                title="Save"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit Budget"
            >
              <Pencil className="h-3 w-3" />
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
    let result = filterByTimeRange(transactions, timeFilter, customDateRange);

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
  const categoryTotals = useMemo(
    () =>
      getCategoryTotals(transactions, timeFilter, {
        customRange: customDateRange,
      }),
    [transactions, timeFilter, customDateRange]
  );

  // Category totals grouped by budget type (considers manual overrides)
  const categoryTotalsByBudgetType = useMemo(
    () =>
      getCategoryTotalsByBudgetType(transactions, timeFilter, {
        excludeBudgetExcluded: true,
        customRange: customDateRange,
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

  // Total expenses for current filter period (no prorations or exclusions)
  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
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

  const isDark = theme === "dark";
  const isVault = activeView === "investments";

  // Dynamic background based on view
  const getBackground = () => {
    if (isVault) {
      // Iron and stone dungeon vault aesthetic
      return isDark
        ? `radial-gradient(ellipse at top, #1f1f23 0%, #18181b 40%, #09090b 100%)`
        : `radial-gradient(ellipse at top, #6b7280 0%, #4b5563 40%, #374151 100%)`;
    }
    // Worn parchment paper for ledger/trends
    return isDark
      ? `radial-gradient(ellipse at top, #2a2218 0%, #1a1510 50%, #0f0d0a 100%)`
      : `radial-gradient(ellipse at top, #fdf6e3 0%, #f5e6c8 50%, #e8d4b0 100%)`;
  };

  const getHeaderBackground = () => {
    return isDark
      ? "rgba(9, 9, 11, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
  };

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden relative"
      style={{ background: getBackground() }}
    >
      {/* Texture overlay - stone for vault, paper for ledger */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isVault ? (isDark ? 0.08 : 0.15) : (isDark ? 0.05 : 0.08),
          backgroundImage: isVault
            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            : `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vault iron bars / stone blocks pattern overlay */}
      {isVault && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isDark ? 0.03 : 0.05,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(0,0,0,0.1) 40px,
              rgba(0,0,0,0.1) 42px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 60px,
              rgba(0,0,0,0.08) 60px,
              rgba(0,0,0,0.08) 62px
            )`,
          }}
        />
      )}

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isVault
            ? isDark
              ? `radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.7) 100%)`
              : `radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.3) 100%)`
            : isDark
              ? `radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.6) 100%)`
              : `radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(139, 90, 43, 0.15) 100%)`,
        }}
      />

      {/* Torch glow effect for vault */}
      {isVault && (
        <>
          <div
            className="absolute top-0 left-0 w-32 h-48 pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(ellipse at top left, rgba(251, 146, 60, 0.08) 0%, transparent 70%)"
                : "radial-gradient(ellipse at top left, rgba(251, 146, 60, 0.1) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-32 h-48 pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(ellipse at top right, rgba(251, 146, 60, 0.06) 0%, transparent 70%)"
                : "radial-gradient(ellipse at top right, rgba(251, 146, 60, 0.08) 0%, transparent 70%)",
            }}
          />
        </>
      )}

      {/* Header with TopTabs - Fixed on mobile */}
      <header
        className="md:shrink-0 md:relative fixed top-0 left-0 right-0 z-20"
        style={{
          background: getHeaderBackground(),
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Top Tabs Navigation with Date Filter */}
          <TopTabs
            navItems={FINANCE_NAV_ITEMS}
            activeView={activeView}
            onViewChange={(view) => onViewChange(view as ActiveView)}
            onGoHome={onGoHome}
            title="Treasury"
            accentColor="#8b5cf6"
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

      {/* Mobile FAB - styled as wax seal */}
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
              // Wax seal / gold coin style
              background: isDark
                ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)"
                : "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)",
              boxShadow: isDark
                ? "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 16px rgba(139, 92, 246, 0.5)"
                : "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 16px rgba(139, 92, 246, 0.4)",
              border: isDark
                ? "3px solid #7c3aed"
                : "3px solid #a855f7",
            }}
            aria-label="Add expense"
          >
            {/* Wax seal texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
              }}
            />
            <Plus className="h-6 w-6 text-white relative z-10" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
