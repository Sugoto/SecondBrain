import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useHealthData } from "@/hooks/useHealthData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface WorkoutCalendarProps {
  className?: string;
}

function formatDateKey(date: Date): string {
  // Use local timezone instead of UTC to avoid date shift issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add padding days for next month to complete the grid
  const endPadding = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function WorkoutCalendar({ className }: WorkoutCalendarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { workoutDates, toggleWorkoutDate } = useHealthData();

  // Memoize today's date to prevent unnecessary re-renders
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [currentMonth, setCurrentMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [direction, setDirection] = useState(0);

  const days = useMemo(
    () => getDaysInMonth(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleToggleWorkoutDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    // Don't allow future dates
    if (dateKey > todayKey) return;
    toggleWorkoutDate(dateKey);
  };

  const goToPreviousMonth = () => {
    setDirection(-1);
    setCurrentMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: newMonth };
    });
  };

  // Stats for current month
  const workoutCount = useMemo(() => {
    let count = 0;
    days.forEach((date) => {
      if (
        date.getMonth() === currentMonth.month &&
        workoutDates.has(formatDateKey(date))
      ) {
        count++;
      }
    });
    return count;
  }, [days, currentMonth.month, workoutDates]);

  const isToday = (date: Date) => formatDateKey(date) === todayKey;

  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.month;

  const isFuture = (date: Date) => formatDateKey(date) > todayKey;

  const isWorkoutDay = (date: Date) => workoutDates.has(formatDateKey(date));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      <Card
        className="p-4 overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(20, 20, 24, 0.9) 0%, rgba(30, 30, 35, 0.8) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.4)"
            : "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Header with Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8 rounded-lg hover:bg-orange-500/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <motion.h2
            key={monthName}
            initial={{ opacity: 0, y: direction * 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-base font-semibold"
          >
            {monthName}
          </motion.h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-orange-500/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-[10px] font-medium text-muted-foreground text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentMonth.year}-${currentMonth.month}`}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map((date, index) => {
              const dateKey = formatDateKey(date);
              const inMonth = isCurrentMonth(date);
              const todayDate = isToday(date);
              const future = isFuture(date);
              const workout = isWorkoutDay(date);

              return (
                <motion.button
                  key={dateKey}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * 0.008,
                    duration: 0.2,
                  }}
                  whileHover={!future && inMonth ? { scale: 1.1 } : undefined}
                  whileTap={!future && inMonth ? { scale: 0.95 } : undefined}
                  onClick={() => inMonth && handleToggleWorkoutDay(date)}
                  disabled={future || !inMonth}
                  className={`
                    relative aspect-square rounded-xl flex items-center justify-center
                    transition-all duration-200 text-sm font-medium
                    ${
                      !inMonth
                        ? "text-muted-foreground/30 cursor-default"
                        : future
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                    ${
                      todayDate && !workout
                        ? "ring-2 ring-orange-500/50 ring-offset-1 ring-offset-background"
                        : ""
                    }
                  `}
                  style={
                    workout && inMonth
                      ? {
                          background: isDark
                            ? "linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.2) 100%)"
                            : "linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)",
                          boxShadow: isDark
                            ? "0 0 20px rgba(249, 115, 22, 0.3), inset 0 0 20px rgba(249, 115, 22, 0.1)"
                            : "0 0 16px rgba(249, 115, 22, 0.25)",
                          border: isDark
                            ? "1px solid rgba(249, 115, 22, 0.4)"
                            : "1px solid rgba(249, 115, 22, 0.3)",
                        }
                      : inMonth && !future
                      ? {
                          background: isDark
                            ? "rgba(255, 255, 255, 0.03)"
                            : "rgba(0, 0, 0, 0.02)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`
                      ${workout && inMonth ? "text-orange-500 font-bold" : ""}
                      ${todayDate ? "text-orange-500" : ""}
                    `}
                  >
                    {date.getDate()}
                  </span>

                  {/* Workout indicator - dumbbell icon */}
                  {workout && inMonth && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="absolute -top-0.5 -right-0.5"
                    >
                      <Dumbbell
                        className="h-2.5 w-2.5 text-orange-500"
                        style={{
                          filter:
                            "drop-shadow(0 0 3px rgba(249, 115, 22, 0.6))",
                        }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-4 pt-4 border-t"
          style={{
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Workouts This Month */}
          <div
            className="p-3 rounded-xl text-center"
            style={{
              background: isDark
                ? "rgba(249, 115, 22, 0.1)"
                : "rgba(249, 115, 22, 0.08)",
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Dumbbell className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                This Month
              </span>
            </div>
            <motion.p
              key={workoutCount}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold font-mono text-orange-500"
            >
              {workoutCount}
            </motion.p>
            <p className="text-[10px] text-muted-foreground">workouts</p>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}
