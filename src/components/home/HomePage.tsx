import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Dumbbell,
  Wallet,
  Check,
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Pill,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import { useMutualFundWatchlist } from "@/hooks/useMutualFunds";
import { useMedicationData } from "@/hooks/useMedicationData";
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

// million-ignore - SVG elements not compatible with Million.js
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

interface BudgetCardProps {
  onAddExpense: () => void;
}

function BudgetCard({ onAddExpense }: BudgetCardProps) {
  const { transactions } = useExpenseData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const budgetInfo = useMemo(() => {
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
  }, [transactions]);

  const { percentUsed, totalRemaining } = budgetInfo;
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
      <button
        onClick={onAddExpense}
        className="w-full aspect-square rounded-2xl p-2.5 sm:p-3 relative overflow-hidden flex flex-col text-left transition-transform active:scale-[0.98]"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
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
          <Plus className="h-3 w-3 text-muted-foreground/50" />
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
              <span className="text-sm sm:text-base font-bold font-mono text-foreground">
                {formatCurrencyCompact(totalRemaining)}
              </span>
              <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                left
              </span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// Compact mini-widget for Mutual Funds (today's change only)
function MiniMutualFundWidget() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { funds } = useMutualFundWatchlist();
  const { userStats } = useUserStats();

  const dailyChange = useMemo(() => {
    if (funds.length === 0) return null;
    const investments = userStats?.investments || [];

    let change = 0;
    funds.forEach((fund) => {
      const fundInvestments = investments.filter(
        (i) => i.schemeCode === fund.schemeCode
      );
      const totalUnits = fundInvestments.reduce((sum, i) => sum + i.units, 0);
      const currentValue = totalUnits * fund.currentNav;
      const previousValue = totalUnits * fund.previousNav;
      change += currentValue - previousValue;
    });

    return change;
  }, [funds, userStats?.investments]);

  if (dailyChange === null) return null;

  const isUp = dailyChange >= 0;
  const trendColor = isUp ? "#22c55e" : "#ef4444";

  return (
    <div
      className="flex-1 rounded-xl p-2 sm:p-2.5 flex items-center gap-2"
      style={{
        background: isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: isUp
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        }}
      >
        {isUp ? (
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        ) : (
          <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Mutual Funds
        </p>
        <p
          className="text-sm sm:text-base font-bold font-mono"
          style={{ color: trendColor }}
        >
          {isUp ? "+" : "-"}₹
          {Math.abs(dailyChange).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>
  );
}

// Compact mini-widget for Nutrition with workout toggle
function MiniNutritionWidget() {
  const { userStats, workoutDates, toggleWorkoutDate, isWorkoutSaving } =
    useHealthData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Use local timezone for date key
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const isTodayWorkedOut = workoutDates.has(today);

  const calories = useMemo(() => {
    if (!userStats) return null;
    const activityInfo = getActivityLevelInfo(workoutDates);
    const tdee = calculateTDEE(
      {
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
        activity_level: activityInfo.level,
      },
      activityInfo.multiplier
    );
    return tdee?.targetCalories ?? null;
  }, [userStats, workoutDates]);

  const handleToggleWorkout = () => {
    if (!userStats?.id) return;
    toggleWorkoutDate(today);
  };

  if (!calories) return null;

  return (
    <button
      onClick={handleToggleWorkout}
      disabled={!userStats?.id || isWorkoutSaving}
      className="flex-1 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 text-left transition-transform active:scale-[0.98] disabled:opacity-50"
      style={{
        background: isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        }}
      >
        {isWorkoutSaving ? (
          <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white animate-spin" />
        ) : isTodayWorkedOut ? (
          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        ) : (
          <Dumbbell className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {isTodayWorkedOut ? "Worked Out" : "Mark Workout"}
        </p>
        <p className="text-sm sm:text-base font-bold font-mono text-foreground">
          {formatNumber(calories)} kcal
        </p>
      </div>
    </button>
  );
}

// Combined stacked widget for MF + Nutrition
function StackedMiniWidgets() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0"
    >
      <div className="aspect-square flex flex-col gap-2">
        <MiniMutualFundWidget />
        <MiniNutritionWidget />
      </div>
    </motion.div>
  );
}

// Minimal full-width supplements widget
function SupplementsWidget() {
  const { medications, toggling, toggleMedication, isTakenToday, loading } =
    useMedicationData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const takenCount = medications.filter((m) => isTakenToday(m.id)).length;
  const allTaken = takenCount === medications.length;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full mt-3"
      >
        <div
          className="rounded-2xl p-4"
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full mt-3"
    >
      <div
        className="rounded-2xl p-3 sm:p-4"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{
                background: allTaken
                  ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              }}
            >
              {allTaken ? (
                <Check className="h-3 w-3 text-white" />
              ) : (
                <Pill className="h-3 w-3 text-white" />
              )}
            </div>
            <span className="text-xs font-medium text-foreground">
              Supplements
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {takenCount}/{medications.length}
          </span>
        </div>

        {/* Pills Grid */}
        <div className="grid grid-cols-4 gap-2">
          {medications.map((med) => {
            const isTaken = isTakenToday(med.id);
            const isToggling = toggling === med.id;

            return (
              <button
                key={med.id}
                onClick={() => toggleMedication(med.id)}
                disabled={isToggling}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: isTaken
                    ? isDark
                      ? `${med.color}20`
                      : `${med.color}15`
                    : isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                  border: isTaken
                    ? `1px solid ${med.color}40`
                    : "1px solid transparent",
                }}
              >
                {/* Icon Circle */}
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isTaken
                      ? `linear-gradient(135deg, ${med.color} 0%, ${med.color}cc 100%)`
                      : isDark
                      ? `${med.color}25`
                      : `${med.color}20`,
                    boxShadow: isTaken ? `0 2px 8px ${med.color}40` : "none",
                  }}
                >
                  {isToggling ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ color: isTaken ? "white" : med.color }}
                    />
                  ) : isTaken ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Pill
                      className="h-3.5 w-3.5"
                      style={{ color: med.color }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-[9px] font-medium text-center leading-tight line-clamp-2"
                  style={{
                    color: isTaken ? med.color : "var(--muted-foreground)",
                  }}
                >
                  {med.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const { addTransaction } = useExpenseData();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Transaction | null>(
    null
  );
  const [saving, setSaving] = useState(false);

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
        <div className="flex gap-2">
          <BudgetCard onAddExpense={handleAddExpense} />
          <StackedMiniWidgets />
        </div>

        {/* Supplements Widget */}
        <SupplementsWidget />
      </main>

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
