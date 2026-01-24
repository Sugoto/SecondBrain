import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sofa, Footprints, Dumbbell, Flame, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useHealthData } from "@/hooks/useHealthData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ACTIVITY_LEVELS } from "./types";
import type { ActivityLevel } from "@/lib/supabase";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Icons for each activity level
const LEVEL_ICONS = {
  sedentary: Sofa,
  light: Footprints,
  moderate: Dumbbell,
  heavy: Flame,
};

interface WorkoutCalendarProps {
  className?: string;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateKey: string): string {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function getLevelInfo(level: ActivityLevel | undefined) {
  return ACTIVITY_LEVELS.find((l) => l.value === level);
}

export function WorkoutCalendar({ className }: WorkoutCalendarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { activityLog, setActivityLevel } = useHealthData();

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [currentMonth, setCurrentMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    () => getDaysInMonth(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleDateTap = (date: Date) => {
    const dateKey = formatDateKey(date);
    if (dateKey > todayKey) return;
    setSelectedDate(dateKey);
  };

  const handleSelectLevel = (level: ActivityLevel | null) => {
    if (selectedDate) {
      setActivityLevel(selectedDate, level);
      setSelectedDate(null);
    }
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
  const monthStats = useMemo(() => {
    const counts: Record<ActivityLevel, number> = {
      sedentary: 0,
      light: 0,
      moderate: 0,
      heavy: 0,
    };
    days.forEach((date) => {
      if (date.getMonth() === currentMonth.month) {
        const level = activityLog[formatDateKey(date)];
        if (level) counts[level]++;
      }
    });
    return counts;
  }, [days, currentMonth.month, activityLog]);

  const isToday = (date: Date) => formatDateKey(date) === todayKey;
  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.month;
  const isFuture = (date: Date) => formatDateKey(date) > todayKey;

  const selectedLevel = selectedDate ? activityLog[selectedDate] : undefined;

  return (
    <div className={className}>
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
        {/* Header */}
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
              const level = activityLog[dateKey];
              const levelInfo = getLevelInfo(level);

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
                  onClick={() => inMonth && handleDateTap(date)}
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
                      todayDate && !level
                        ? "ring-2 ring-orange-500/50 ring-offset-1 ring-offset-background"
                        : ""
                    }
                  `}
                  style={
                    level && inMonth && levelInfo
                      ? {
                          background: isDark
                            ? `${levelInfo.color}30`
                            : `${levelInfo.color}20`,
                          boxShadow: isDark
                            ? `0 0 16px ${levelInfo.color}40`
                            : `0 0 12px ${levelInfo.color}30`,
                          border: `1px solid ${levelInfo.color}50`,
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
                    className={`${todayDate ? "text-orange-500 font-bold" : ""}`}
                    style={level && levelInfo ? { color: levelInfo.color, fontWeight: 600 } : undefined}
                  >
                    {date.getDate()}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend + Sync */}
        <div
          className="mt-4 pt-4 border-t"
          style={{
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="grid grid-cols-4 gap-2">
            {ACTIVITY_LEVELS.map((level) => (
              <div
                key={level.value}
                className="p-2 rounded-lg text-center"
                style={{
                  background: isDark
                    ? `${level.color}15`
                    : `${level.color}10`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ background: level.color }}
                />
                <p
                  className="text-xs font-bold font-mono"
                  style={{ color: level.color }}
                >
                  {monthStats[level.value]}
                </p>
                <p className="text-[8px] text-muted-foreground truncate">
                  {level.label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </Card>

      {/* Activity Level Selection Drawer */}
      <Drawer open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DrawerContent className="pb-24">
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">
                {selectedDate && formatDateDisplay(selectedDate)}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_LEVELS.map((level) => {
                const Icon = LEVEL_ICONS[level.value];
                const isSelected = selectedLevel === level.value;

                return (
                  <button
                    key={level.value}
                    onClick={() => handleSelectLevel(level.value)}
                    className={`
                      p-4 rounded-2xl text-left transition-all
                      ${isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""}
                    `}
                    style={{
                      background: isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(0, 0, 0, 0.02)",
                      border: `1px solid ${isSelected ? level.color + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                      ["--tw-ring-color" as string]: level.color,
                    }}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${level.color}25` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: level.color }} />
                    </div>
                    <p className="font-semibold text-sm">
                      {level.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Clear button */}
            {selectedLevel && (
              <button
                onClick={() => handleSelectLevel(null)}
                className="w-full mt-3 py-3 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                }}
              >
                Clear Activity
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
