import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
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

interface DateFilterProps {
  activeView: ActiveView;
  timeFilter: TimeFilter;
  chartMode: ChartMode;
  customDateRange: DateRange;
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

export function DateFilter({
  activeView,
  timeFilter,
  chartMode,
  customDateRange,
  onTimeFilterChange,
  onChartModeChange,
  onCustomDateRangeChange,
}: DateFilterProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ from?: Date; to?: Date }>({});

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

  return (
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
          className="h-9 px-3 rounded-lg flex items-center gap-2 transition-all border-2 border-black dark:border-white bg-pastel-yellow text-black dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1a1a1a] dark:hover:shadow-[3px_3px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <CalendarDays className="h-4 w-4" />
          <span className="text-xs font-bold">{getFilterLabel()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 rounded-xl border-2 border-black dark:border-white bg-background shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#FFFBF0]" 
        align="end"
      >
        {isTrendsView ? (
          // Trends view: Daily/Monthly toggle - Neo-brutalism
          <div className="p-4">
            <p className="text-sm font-bold mb-3 text-foreground">Chart View</p>
            <div className="flex items-center gap-2">
              {(["daily", "monthly"] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onChartModeChange(mode);
                    setFilterOpen(false);
                  }}
                  className={`h-9 flex-1 text-sm font-bold rounded-lg transition-all duration-100 px-4 border-2 ${chartMode === mode
                      ? "bg-pastel-purple border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
                      : "bg-white dark:bg-white/10 border-black/30 dark:border-white/30 text-muted-foreground hover:border-black dark:hover:border-white hover:text-foreground"
                    }`}
                >
                  {mode === "daily" ? "Daily" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Unified time filter view - Neo-brutalism
          <div className="p-4 space-y-4">
            {/* Quick filters */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Quick select</p>
              <div className="flex items-center gap-2">
                {(["today", "week", "month"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      onTimeFilterChange(filter);
                      setFilterOpen(false);
                    }}
                    className={`h-8 flex-1 text-xs font-bold rounded-lg transition-all duration-100 border-2 ${timeFilter === filter
                        ? "bg-pastel-green border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
                        : "bg-white dark:bg-white/10 border-black/30 dark:border-white/30 text-muted-foreground hover:border-black dark:hover:border-white hover:text-foreground"
                      }`}
                  >
                    {TIME_LABELS[filter]}
                  </button>
                ))}
              </div>
            </div>

            {/* Month buttons */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Select month</p>
              <div className="grid grid-cols-3 gap-2">
                {recentMonths.map((month) => (
                  <button
                    key={month.label}
                    onClick={() => handleMonthSelect(month.date)}
                    className="h-8 text-xs font-bold rounded-lg border-2 border-black/30 dark:border-white/30 bg-white dark:bg-white/10 text-foreground transition-all hover:border-black dark:hover:border-white hover:bg-pastel-blue hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0]"
                  >
                    {month.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar for custom range */}
            <div className="border-t-2 border-black/10 dark:border-white/10 pt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
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
                className="rounded-xl border-2 border-black dark:border-white"
              />
              {pendingRange.from && (
                <button
                  onClick={() => setPendingRange({})}
                  className="w-full h-8 mt-3 text-xs font-bold rounded-lg border-2 border-black/30 dark:border-white/30 bg-white dark:bg-white/10 text-muted-foreground transition-all hover:border-black dark:hover:border-white hover:bg-pastel-pink hover:text-foreground"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

