import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Dumbbell,
  Flame,
  Wallet,
  Check,
  Loader2,
  Beef,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import {
  MONTHLY_BUDGET,
  formatCurrencyCompact,
} from "@/components/finances/constants";
import {
  calculateBudgetInfo,
  getMonthlyAmount,
  createEmptyTransaction,
} from "@/components/finances/utils";
import {
  calculateTDEE,
  getActivityLevelInfo,
  formatNumber,
} from "@/components/fitness/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { TransactionDialog } from "@/components/finances/TransactionDialog";
import { MutualFundWidget } from "@/components/finances/MutualFundWidget";
import type { Transaction } from "@/lib/supabase";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

function DateWidget() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const month = now.toLocaleDateString("en-US", { month: "short" });
  const dayNum = now.getDate();

  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full mb-4"
    >
      <div
        className="relative rounded-2xl p-4 overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)",
          border: isDark
            ? "1px solid rgba(59, 130, 246, 0.2)"
            : "1px solid rgba(59, 130, 246, 0.12)",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)"
              : "radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          {/* Calendar icon */}
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
            }}
          >
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>

          <div>
            {/* Greeting line */}
            <p className="text-lg font-semibold">
              <span className="text-foreground">{greeting}, </span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sugoto
              </span>
            </p>

            {/* Date line */}
            <p className="text-sm text-muted-foreground mt-0.5">
              It's {dayName}, {month} {dayNum}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Circular progress component - responsive sizing
function CircularProgress({
  percentage,
  color,
  bgColor,
}: {
  percentage: number;
  color: string;
  bgColor: string;
}) {
  // Use percentage-based sizing for responsiveness
  const size = 80;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-[70%] max-w-[80px] aspect-square transform -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function BudgetCard() {
  const { transactions, loading } = useExpenseData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const budgetInfo = useMemo(() => {
    if (loading) return null;

    // Get current month's expenses (excluding budget-excluded items)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          txDate >= currentMonthStart &&
          t.type === "expense" &&
          !t.excluded_from_budget
        );
      })
      .reduce((sum, t) => sum + getMonthlyAmount(t), 0);

    return calculateBudgetInfo(monthlyExpenses, MONTHLY_BUDGET);
  }, [transactions, loading]);

  if (loading) {
    return (
      <div className="animate-pulse flex-1 min-w-0">
        <div
          className="aspect-square rounded-2xl p-2.5 sm:p-3"
          style={{
            background: isDark
              ? "rgba(139, 92, 246, 0.1)"
              : "rgba(139, 92, 246, 0.05)",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-[60%] aspect-square rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!budgetInfo) return null;

  const { percentUsed, totalRemaining, dailyBudget } = budgetInfo;
  const isOverBudget = percentUsed > 100;

  // Colors based on budget status
  const progressColor = isOverBudget
    ? "#ef4444"
    : percentUsed > 80
    ? "#f59e0b"
    : "#8b5cf6";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0"
    >
      <div
        className="aspect-square rounded-2xl p-2.5 sm:p-3 relative overflow-hidden flex flex-col"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.03) 100%)",
          border: isDark
            ? "1px solid rgba(139, 92, 246, 0.3)"
            : "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            }}
          >
            <Wallet className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Budget
          </span>
        </div>

        {/* Circular Progress */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-1">
          <div className="relative w-full flex items-center justify-center">
            <CircularProgress
              percentage={percentUsed}
              color={progressColor}
              bgColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-base sm:text-lg font-bold font-mono"
                style={{ color: progressColor }}
              >
                {Math.round(percentUsed)}%
              </span>
              <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                used
              </span>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2 text-center">
          <div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              Left
            </p>
            <p
              className="text-[11px] sm:text-xs font-bold font-mono"
              style={{ color: progressColor }}
            >
              {formatCurrencyCompact(totalRemaining)}
            </p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              Daily
            </p>
            <p className="text-[11px] sm:text-xs font-bold font-mono text-foreground">
              {formatCurrencyCompact(dailyBudget)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TDEECard() {
  const { userStats, loading, workoutDates } = useHealthData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const tdee = useMemo(() => {
    if (loading || !userStats) return null;

    const activityInfo = getActivityLevelInfo(workoutDates);
    return calculateTDEE(
      {
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
        activity_level: activityInfo.level,
      },
      activityInfo.multiplier
    );
  }, [userStats, loading, workoutDates]);

  if (loading) {
    return (
      <div className="animate-pulse flex-1 min-w-0">
        <div
          className="aspect-square rounded-2xl p-2.5 sm:p-4"
          style={{
            background: isDark
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(16, 185, 129, 0.05)",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-[50%] aspect-[5/4] rounded-lg bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!tdee) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          delay: 0.1,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="flex-1 min-w-0"
      >
        <div
          className="aspect-square rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)",
            border: isDark
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500/50 mb-2" />
          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
            Add health data to see TDEE
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0"
    >
      <div
        className="aspect-square rounded-2xl p-2.5 sm:p-4 relative overflow-hidden flex flex-col"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)",
          border: isDark
            ? "1px solid rgba(16, 185, 129, 0.3)"
            : "1px solid rgba(16, 185, 129, 0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            }}
          >
            <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Nutrition
          </span>
        </div>

        {/* Stats - centered in available space */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-0">
          {/* Calories */}
          <div className="text-center">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-500">
              {formatNumber(tdee.targetCalories)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-1">
              kcal
            </span>
          </div>

          {/* Protein */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg"
            style={{
              background: isDark
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(245, 158, 11, 0.1)",
            }}
          >
            <Beef className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
            <span className="text-xs sm:text-sm font-bold font-mono text-amber-500">
              {tdee.protein}g
            </span>
            <span className="text-[8px] sm:text-[9px] text-muted-foreground">
              protein
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActions() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { addTransaction } = useExpenseData();
  const { userStats, toggleWorkoutDate, isWorkoutSaving, workoutDates } =
    useHealthData();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Transaction | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isTodayWorkedOut = workoutDates.has(today);

  const handleAddExpense = () => {
    setNewTransaction(createEmptyTransaction());
    setShowAddExpense(true);
  };

  const handleSaveExpense = async (transaction: Transaction) => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...data } = transaction;
      await addTransaction(data);
      setShowAddExpense(false);
      setNewTransaction(null);
    } catch (error) {
      console.error("Failed to save transaction:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTodayWorkout = () => {
    if (!userStats?.id) return;
    toggleWorkoutDate(today);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-2.5 py-2 rounded-full"
        style={{
          background: isDark
            ? "rgba(24, 24, 27, 0.9)"
            : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDark
            ? "0 6px 24px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)"
            : "0 6px 24px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Add Expense Button */}
        <button
          onClick={handleAddExpense}
          className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-[0.97]"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)"
              : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)",
          }}
        >
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.35)",
            }}
          >
            <Plus className="h-3 w-3 text-white" />
          </div>
          <span className="text-[11px] font-medium whitespace-nowrap">
            Expense
          </span>
        </button>

        {/* Divider */}
        <div
          className="h-4 w-px"
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        />

        {/* Mark Workout Button */}
        <button
          onClick={handleToggleTodayWorkout}
          disabled={!userStats?.id || isWorkoutSaving}
          className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: isTodayWorkedOut
              ? isDark
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 100%)"
              : isDark
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%)"
              : "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)",
          }}
        >
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: isTodayWorkedOut
                ? "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
                : "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
              boxShadow: isTodayWorkedOut
                ? "0 2px 8px rgba(16, 185, 129, 0.35)"
                : "0 2px 8px rgba(239, 68, 68, 0.35)",
            }}
          >
            {isWorkoutSaving ? (
              <Loader2 className="h-3 w-3 text-white animate-spin" />
            ) : isTodayWorkedOut ? (
              <Check className="h-3 w-3 text-white" />
            ) : (
              <Dumbbell className="h-3 w-3 text-white" />
            )}
          </div>
          <span className="text-[11px] font-medium whitespace-nowrap">
            {isTodayWorkedOut ? "Worked Out" : "Mark Workout"}
          </span>
        </button>
      </motion.div>

      {/* Transaction Dialog */}
      {showAddExpense && newTransaction && (
        <TransactionDialog
          transaction={newTransaction}
          isNew
          saving={saving}
          onClose={() => {
            setShowAddExpense(false);
            setNewTransaction(null);
          }}
          onSave={handleSaveExpense}
          onChange={setNewTransaction}
        />
      )}
    </>
  );
}

export function HomePage() {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 bg-background p-4">
        <PageHeader
          title="Second Brain"
          icon={Brain}
          iconGradient="linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)"
          iconShadow="0 4px 12px rgba(139, 92, 246, 0.3)"
          accentColor="#8b5cf6"
          noBackground
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Date Widget */}
        <DateWidget />

        {/* Stats Cards Row */}
        <div className="flex gap-3">
          <BudgetCard />
          <TDEECard />
        </div>

        {/* Second Row */}
        <div className="flex gap-3 mt-3">
          <MutualFundWidget />
          <div className="flex-1 min-w-0" /> {/* Spacer to maintain two-column grid */}
        </div>
      </main>

      {/* Floating Quick Actions */}
      <QuickActions />

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          <span
            className="font-medium"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sugoto Basu
          </span>
        </p>
      </footer>
    </div>
  );
}
