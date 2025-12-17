import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sun, Moon, Plus, CalendarDays } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  subMonths,
} from "date-fns";
import type { TimeFilter, ChartMode, ActiveView, DateRange } from "./types";

interface HeaderProps {
  theme: "light" | "dark";
  error: string | null;
  activeView: ActiveView;
  timeFilter: TimeFilter;
  chartMode: ChartMode;
  customDateRange: DateRange;
  onToggleTheme: () => void;
  onAddExpense: () => void;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onChartModeChange: (mode: ChartMode) => void;
  onCustomDateRangeChange: (range: DateRange) => void;
}

const TIME_LABELS: Record<Exclude<TimeFilter, "custom">, string> = {
  today: "Day",
  week: "Week",
  month: "Month",
};

function getRecentMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const date = subMonths(now, i);
    months.push({
      date,
      label: format(date, "MMM yyyy"),
      shortLabel: format(date, "MMM"),
    });
  }
  return months;
}

export function Header({
  theme,
  error,
  activeView,
  timeFilter,
  chartMode,
  customDateRange,
  onToggleTheme,
  onAddExpense,
  onTimeFilterChange,
  onChartModeChange,
  onCustomDateRangeChange,
}: HeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ from?: Date; to?: Date }>(
    {}
  );

  const isDark = theme === "dark";
  const recentMonths = getRecentMonths();

  const handleMonthSelect = (monthDate: Date) => {
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);
    onCustomDateRangeChange({ from, to });
    onTimeFilterChange("custom");
    setPendingRange({});
    setFilterOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!pendingRange.from) {
      setPendingRange({ from: date });
    } else if (!pendingRange.to) {
      const from = pendingRange.from;
      const to = date;

      if (to >= from) {
        onCustomDateRangeChange({ from, to });
        onTimeFilterChange("custom");
      } else {
        onCustomDateRangeChange({ from: to, to: from });
        onTimeFilterChange("custom");
      }
      setPendingRange({});
      setFilterOpen(false);
    }
  };

  const getFilterLabel = () => {
    const now = new Date();

    if (timeFilter === "today") {
      return format(now, "d MMM");
    }

    if (timeFilter === "week") {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, "d")}-${format(weekEnd, "d MMM")}`;
      }
      return `${format(weekStart, "d MMM")}-${format(weekEnd, "d MMM")}`;
    }

    if (timeFilter === "month") {
      return format(now, "MMM");
    }

    if (timeFilter === "custom" && customDateRange) {
      const { from, to } = customDateRange;
      if (
        isSameMonth(from, to) &&
        from.getDate() === 1 &&
        to.getDate() === endOfMonth(to).getDate()
      ) {
        return format(from, "MMM");
      }
      if (isSameMonth(from, to)) {
        return `${format(from, "d")}-${format(to, "d MMM")}`;
      }
      return `${format(from, "d MMM")}-${format(to, "d MMM")}`;
    }

    return format(now, "MMM");
  };

  const isTrendsView = activeView === "trends";

  // Button style with cool color effects
  const buttonStyle = {
    background: isDark
      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)",
    border: isDark
      ? "1px solid rgba(139, 92, 246, 0.3)"
      : "1px solid rgba(139, 92, 246, 0.25)",
    boxShadow: isDark
      ? "0 2px 8px rgba(139, 92, 246, 0.2)"
      : "0 2px 8px rgba(139, 92, 246, 0.1)",
  };

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
          Finances
        </h1>
        <div className="flex items-center gap-2">
          {/* Filter Popover */}
          <Popover
            open={filterOpen}
            onOpenChange={(open) => {
              setFilterOpen(open);
              if (open) {
                setPendingRange({});
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                style={buttonStyle}
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">{getFilterLabel()}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              {isTrendsView ? (
                // Trends view: Daily/Monthly toggle
                <div className="p-3">
                  <p className="text-sm font-medium mb-3">Chart View</p>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {(["daily", "monthly"] as ChartMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          onChartModeChange(mode);
                          setFilterOpen(false);
                        }}
                        className={`h-8 flex-1 text-sm rounded-md transition-all duration-200 px-4 ${
                          chartMode === mode
                            ? "bg-background text-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode === "daily" ? "Daily" : "Monthly"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Unified time filter view
                <div className="p-3 space-y-3">
                  {/* Quick filters */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Quick select
                    </p>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      {(["today", "week", "month"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            onTimeFilterChange(filter);
                            setFilterOpen(false);
                          }}
                          className={`h-7 flex-1 text-xs rounded-md transition-all duration-200 ${
                            timeFilter === filter
                              ? "bg-background text-foreground font-medium shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {TIME_LABELS[filter]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month buttons */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select month
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {recentMonths.map((month) => (
                        <Button
                          key={month.label}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleMonthSelect(month.date)}
                        >
                          {month.shortLabel}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Calendar for custom range */}
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {pendingRange.from
                        ? `From ${format(pendingRange.from, "d MMM")} — pick end`
                        : "Or pick a date range"}
                    </p>
                    <Calendar
                      mode="single"
                      selected={pendingRange.from}
                      onSelect={handleDateSelect}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      defaultMonth={customDateRange?.from || new Date()}
                      className="rounded-md border"
                    />
                    {pendingRange.from && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs mt-2"
                        onClick={() => setPendingRange({})}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={buttonStyle}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-primary" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </button>

          {/* Desktop Add Button */}
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
    </div>
  );
}

