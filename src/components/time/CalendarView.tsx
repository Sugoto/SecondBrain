import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(
    today.getDate()
  );

  const isCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const navigateMonth = (direction: -1 | 1) => {
    if (direction === -1) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.getDate());
  };

  return (
    <div className="p-4 space-y-4">
      {/* Calendar Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg transition-colors hover:bg-muted active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={goToToday}
            className="flex flex-col items-center"
          >
            <span className="text-lg font-semibold text-foreground">
              {MONTHS[currentMonth]}
            </span>
            <span className="text-xs text-muted-foreground">{currentYear}</span>
          </button>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg transition-colors hover:bg-muted active:scale-95"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 px-4 pb-2">
          {WEEKDAYS.map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 px-4 pb-4">
          {calendarDays.map((day, index) => {
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = day === selectedDate;

            return (
              <button
                key={index}
                onClick={() => day && setSelectedDate(day)}
                disabled={!day}
                className="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                    : isToday
                    ? isDark
                      ? "rgba(20, 184, 166, 0.15)"
                      : "rgba(20, 184, 166, 0.1)"
                    : "transparent",
                  color: isSelected
                    ? "white"
                    : isToday
                    ? "#14b8a6"
                    : day
                    ? "var(--foreground)"
                    : "transparent",
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(20, 184, 166, 0.3)"
                    : "none",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Date Card */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
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
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{
                background: isDark
                  ? "rgba(20, 184, 166, 0.15)"
                  : "rgba(20, 184, 166, 0.1)",
              }}
            >
              <span className="text-xl font-bold text-teal-500">
                {selectedDate}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {MONTHS[currentMonth]} {selectedDate}, {currentYear}
              </p>
              <p className="text-xs text-muted-foreground">
                No events scheduled
              </p>
            </div>
          </div>

          {/* Placeholder for future event list */}
          <div
            className="mt-4 rounded-xl p-4 text-center"
            style={{
              background: isDark
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.01)",
              border: `1px dashed ${
                isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
              }`,
            }}
          >
            <p className="text-xs text-muted-foreground">
              Tap to add time blocks & events
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

