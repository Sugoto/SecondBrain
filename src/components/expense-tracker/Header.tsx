import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, RefreshCw, Plus } from "lucide-react";
import { formatCurrency, MONTHLY_BUDGET } from "./constants";
import { calculateBudgetInfo } from "./utils";

interface HeaderProps {
  totalExpenses: number;
  theme: "light" | "dark";
  error: string | null;
  refreshing: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onAddExpense: () => void;
}

export function Header({
  totalExpenses,
  theme,
  error,
  refreshing,
  onToggleTheme,
  onRefresh,
  onAddExpense,
}: HeaderProps) {
  // Separate toggle states for spent and remaining
  const [showDailySpent, setShowDailySpent] = useState(false);
  const [showDailyRemaining, setShowDailyRemaining] = useState(false);

  const { dailyBudget, totalRemaining, percentUsed } = calculateBudgetInfo(
    totalExpenses,
    MONTHLY_BUDGET
  );

  // Calculate daily spent (total spent divided by days elapsed this month)
  const currentDay = new Date().getDate();
  const dailySpent = currentDay > 0 ? totalExpenses / currentDay : 0;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-sm">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Title Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Expense Tracker
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh transactions"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs hidden md:flex"
            onClick={onAddExpense}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="space-y-2">
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
                    : formatCurrency(totalExpenses)}
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
            {/* Shine effect */}
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
