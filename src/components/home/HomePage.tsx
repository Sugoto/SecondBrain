import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Pill,
  Loader2,
  Check,
  Dumbbell,
  Building2,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData, useUserStats } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import { useMutualFundWatchlist } from "@/hooks/useMutualFunds";
import { useMedicationData } from "@/hooks/useMedicationData";
import { useTimeEvents, getEventsForDate, getTodayDate } from "@/hooks/useTimeEvents";
import { formatCurrencyCompact } from "@/components/finances/constants";
import {
  calculateBudgetTypeInfo,
  createEmptyTransaction,
} from "@/components/finances/utils";
import {
  calculateTDEE,
  getActivityLevelInfo,
  formatNumber,
} from "@/components/fitness/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { TransactionDialog } from "@/components/finances/TransactionDialog";
import { OfficeDialog } from "@/components/time/OfficeDialog";
import { EVENT_CATEGORIES, DEFAULT_DAILY_EVENTS } from "@/lib/supabase";
import type { Transaction, TimeEvent } from "@/lib/supabase";

function getCategoryColor(categoryId: string): string {
  return EVENT_CATEGORIES.find((c) => c.id === categoryId)?.color || "#6b7280";
}

function ScheduleCard({ onOfficeClick }: { onOfficeClick: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { events } = useTimeEvents();

  const today = getTodayDate();
  const userEvents = useMemo(
    () => getEventsForDate(events, today),
    [events, today]
  );

  // Merge user events with default daily events
  const allEvents = useMemo(() => {
    const defaultEvents: TimeEvent[] = DEFAULT_DAILY_EVENTS.map((e, i) => ({
      ...e,
      id: `default-${i}`,
      date: today,
      created_at: "",
    }));
    return [...defaultEvents, ...userEvents];
  }, [userEvents, today]);

  // Calculate free time
  const scheduledMinutes = useMemo(() => {
    return allEvents.reduce((total, event) => {
      if (!event.end_time) return total;
      const [startH, startM] = event.start_time.split(":").map(Number);
      const [endH, endM] = event.end_time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return total + Math.max(0, endMinutes - startMinutes);
    }, 0);
  }, [allEvents]);

  const freeMinutes = Math.max(0, 24 * 60 - scheduledMinutes);
  const freeHours = Math.floor(freeMinutes / 60);
  const freeMinutesRemainder = Math.round(freeMinutes % 60);

  // Create 24-hour map with category colors
  const hourlyColors = useMemo(() => {
    const colors: (string | null)[] = new Array(24).fill(null);
    allEvents.forEach((event) => {
      if (!event.end_time) return;
      const [startH] = event.start_time.split(":").map(Number);
      const [endH, endM] = event.end_time.split(":").map(Number);
      const endHour = endM > 0 ? endH : endH - 1;
      const eventColor = getCategoryColor(event.category);
      for (let h = startH; h <= Math.min(23, endHour); h++) {
        if (!colors[h]) {
          colors[h] = eventColor;
        }
      }
    });
    return colors;
  }, [allEvents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full mb-4"
    >
      <div
        className="relative rounded-xl px-3 py-2.5 overflow-hidden"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Today's Schedule
          </p>
          <div className="flex items-center gap-2">
            {/* Office Button */}
            <button
              onClick={onOfficeClick}
              className="flex items-center gap-1 px-2 py-1 rounded-md transition-all active:scale-95"
              style={{
                background: isDark
                  ? "rgba(20, 184, 166, 0.15)"
                  : "rgba(20, 184, 166, 0.1)",
                border: "1px solid rgba(20, 184, 166, 0.25)",
              }}
            >
              <Building2 className="h-3 w-3 text-teal-500" />
              <span className="text-[10px] font-medium text-teal-500">Office</span>
            </button>
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-xs font-bold font-mono"
                style={{ color: "#14b8a6" }}
              >
                {freeHours}h {freeMinutesRemainder}m
              </span>
              <span className="text-[9px] text-muted-foreground ml-1">free</span>
            </div>
          </div>
        </div>

        {/* Segmented 24-hour timeline */}
        <div className="flex gap-[2px]">
          {hourlyColors.map((color, hour) => (
            <motion.div
              key={hour}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, delay: hour * 0.02 }}
              className="flex-1 h-2.5 rounded-sm"
              style={{
                background: color
                  ? `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`
                  : isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)",
                boxShadow: color ? `0 2px 4px ${color}40` : "none",
              }}
              title={`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${
                hour < 12 ? "AM" : "PM"
              }`}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">12am</span>
          <span className="text-[9px] text-muted-foreground">6am</span>
          <span className="text-[9px] text-muted-foreground">12pm</span>
          <span className="text-[9px] text-muted-foreground">6pm</span>
          <span className="text-[9px] text-muted-foreground">12am</span>
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
  const { userStats } = useUserStats();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Use the same calculation as the expenses page for consistency
  const budgetTypeInfo = useMemo(() => {
    return calculateBudgetTypeInfo(
      transactions,
      userStats?.needs_budget,
      userStats?.wants_budget
    );
  }, [transactions, userStats?.needs_budget, userStats?.wants_budget]);

  const percentUsed = budgetTypeInfo.wantsPercent;
  const totalRemaining = budgetTypeInfo.wantsRemaining;
  const isOverBudget = percentUsed > 100;

  // Colors based on budget status (orange for wants theme)
  const progressColor = isOverBudget
    ? "#ef4444"
    : percentUsed > 80
    ? "#f59e0b"
    : "#f97316";

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
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              }}
            >
              <Wallet className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Wants Budget
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

// Compact mini-widget for Nutrition with activity level and workout toggle
function MiniNutritionWidget() {
  const { userStats, activityLog, workoutDates, toggleWorkout } = useHealthData();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Use local timezone for date key
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const todayLevel = activityLog[today];
  const isWorkoutToday = workoutDates.has(today);

  const { calories, activityInfo } = useMemo(() => {
    if (!userStats) return { calories: null, activityInfo: null };
    const info = getActivityLevelInfo(activityLog);
    const tdee = calculateTDEE(
      {
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
        activity_level: info.level,
      },
      info.multiplier
    );
    return { calories: tdee?.targetCalories ?? null, activityInfo: info };
  }, [userStats, activityLog]);

  if (!calories) return null;

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
      {/* Workout toggle button */}
      <button
        onClick={() => toggleWorkout(today)}
        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95"
        style={{
          background: isWorkoutToday
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          boxShadow: isWorkoutToday 
            ? "0 2px 8px rgba(34, 197, 94, 0.4)" 
            : "0 2px 8px rgba(249, 115, 22, 0.3)",
        }}
      >
        {isWorkoutToday ? (
          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        ) : (
          <Dumbbell className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {todayLevel ? `${todayLevel}` : activityInfo?.label ?? "Nutrition"}
        </p>
        <p className="text-sm sm:text-base font-bold font-mono text-foreground">
          {formatNumber(calories)} kcal
        </p>
      </div>
    </div>
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
  const [showOfficeDialog, setShowOfficeDialog] = useState(false);
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
        {/* Schedule Card */}
        <ScheduleCard onOfficeClick={() => setShowOfficeDialog(true)} />

        {/* Stats Cards Row */}
        <div className="flex gap-2">
          <BudgetCard onAddExpense={handleAddExpense} />
          <StackedMiniWidgets />
        </div>

        {/* Supplements Widget */}
        <SupplementsWidget />
      </main>

      {/* Office Dialog */}
      <OfficeDialog
        open={showOfficeDialog}
        onOpenChange={setShowOfficeDialog}
      />

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
