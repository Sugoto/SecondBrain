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
import type { TimeFilter, ActiveView, DateRange } from "./types";

interface DateFilterProps {
  activeView: ActiveView;
  timeFilter: TimeFilter;
  customDateRange: DateRange;
  onTimeFilterChange: (filter: TimeFilter) => void;
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
  customDateRange,
  onTimeFilterChange,
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
    if (timeFilter === "today") return format(now, "d MMM");
    if (timeFilter === "week") {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, "d")}–${format(weekEnd, "d MMM")}`;
      }
      return `${format(weekStart, "d MMM")}–${format(weekEnd, "d MMM")}`;
    }
    if (timeFilter === "month") return format(now, "MMM");
    if (timeFilter === "custom" && customDateRange) {
      const { from, to } = customDateRange;
      if (
        isSameMonth(from, to) &&
        from.getDate() === 1 &&
        to.getDate() === endOfMonth(to).getDate()
      ) {
        return format(from, "MMM");
      }
      if (isSameMonth(from, to)) return `${format(from, "d")}–${format(to, "d MMM")}`;
      return `${format(from, "d MMM")}–${format(to, "d MMM")}`;
    }
    return format(now, "MMM");
  };

  if (activeView === "trends") return null;

  return (
    <Popover
      open={filterOpen}
      onOpenChange={(open) => {
        setFilterOpen(open);
        if (open) setPendingRange({});
      }}
    >
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-2 h-8 px-3 border border-outline-variant rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <CalendarDays className="h-3 w-3" strokeWidth={1.5} />
          <span className="font-mono tabular-nums text-[11px]">
            {getFilterLabel()}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl border border-outline-variant bg-background shadow-2xl"
        align="end"
      >
        <div className="p-5 space-y-5 min-w-[280px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Quick select
            </p>
            <div className="grid grid-cols-3 border-y border-outline-variant divide-x divide-outline-variant">
              {(["today", "week", "month"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    onTimeFilterChange(filter);
                    setFilterOpen(false);
                  }}
                  className={`h-9 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    timeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TIME_LABELS[filter]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Recent months
            </p>
            <div className="grid grid-cols-3 gap-2">
              {recentMonths.map((month) => (
                <button
                  key={month.label}
                  onClick={() => handleMonthSelect(month.date)}
                  className="h-8 text-[11px] uppercase tracking-[0.16em] border border-outline-variant rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {month.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/60 pt-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              {pendingRange.from
                ? `From ${format(pendingRange.from, "d MMM")} — pick end`
                : "Custom range"}
            </p>
            <Calendar
              mode="single"
              selected={pendingRange.from}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={new Date().getFullYear()}
              defaultMonth={customDateRange?.from || new Date()}
              className="rounded-xl border border-outline-variant"
            />
            {pendingRange.from && (
              <button
                onClick={() => setPendingRange({})}
                className="w-full h-8 mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
