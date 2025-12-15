import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { TimeFilter, ChartMode, ActiveView, DateRange } from "./types";

interface FilterBarProps {
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

// Generate last 6 months for quick selection
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

export function FilterBar({
  activeView,
  timeFilter,
  chartMode,
  customDateRange,
  onTimeFilterChange,
  onChartModeChange,
  onCustomDateRangeChange,
}: FilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ from?: Date; to?: Date }>({});
  const [showMonths, setShowMonths] = useState(true); // Start with month view

  const recentMonths = getRecentMonths();

  // Trends view: Daily/Monthly toggle
  if (activeView === "trends") {
    return (
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-1">
        {(["daily", "monthly"] as ChartMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onChartModeChange(mode)}
            className={`h-8 flex-1 text-sm rounded-md transition-all duration-200 ${
              chartMode === mode
                ? "bg-background text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={chartMode === mode ? {
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
            } : undefined}
          >
            {mode === "daily" ? "Daily" : "Monthly"}
          </button>
        ))}
      </div>
    );
  }

  const handleMonthSelect = (monthDate: Date) => {
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);
    onCustomDateRangeChange({ from, to });
    onTimeFilterChange("custom");
    setPendingRange({});
    setCalendarOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!pendingRange.from) {
      // First click - set start date
      setPendingRange({ from: date });
    } else if (!pendingRange.to) {
      // Second click - set end date and apply
      const from = pendingRange.from;
      const to = date;
      
      // Ensure from <= to
      if (to >= from) {
        onCustomDateRangeChange({ from, to });
        onTimeFilterChange("custom");
      } else {
        onCustomDateRangeChange({ from: to, to: from });
        onTimeFilterChange("custom");
      }
      setPendingRange({});
      setCalendarOpen(false);
    }
  };

  const getCustomLabel = () => {
    if (!customDateRange) return "";
    const { from, to } = customDateRange;
    
    // If it's a full month, show just the month name
    if (isSameMonth(from, to) && 
        from.getDate() === 1 && 
        to.getDate() === endOfMonth(to).getDate()) {
      return format(from, "MMM yyyy");
    }
    
    // Otherwise show date range
    if (isSameMonth(from, to)) {
      return `${format(from, "d")}-${format(to, "d MMM")}`;
    }
    return `${format(from, "d MMM")} - ${format(to, "d MMM")}`;
  };

  const isCustomActive = timeFilter === "custom" && customDateRange;

  // Expenses and Categories: Time filter with calendar
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-1">
        {(["today", "week", "month"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => onTimeFilterChange(filter)}
            className={`h-8 flex-1 text-sm rounded-md transition-all duration-200 ${
              timeFilter === filter
                ? "bg-background text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={timeFilter === filter ? {
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
            } : undefined}
          >
            {TIME_LABELS[filter]}
          </button>
        ))}
      </div>

      <Popover open={calendarOpen} onOpenChange={(open) => {
        setCalendarOpen(open);
        if (open) {
          setShowMonths(true); // Reset to month view when opening
          setPendingRange({});
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustomActive ? "default" : "outline"}
            size="sm"
            className={`h-10 gap-1.5 px-3 shrink-0 ${
              isCustomActive ? "" : "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            {isCustomActive ? (
              <span className="text-xs font-medium">{getCustomLabel()}</span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          {showMonths ? (
            // Month quick-select view
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Select a month</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setShowMonths(false)}
                >
                  Pick dates
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {recentMonths.map((month) => (
                  <Button
                    key={month.label}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => handleMonthSelect(month.date)}
                  >
                    {month.shortLabel}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Or click "Pick dates" for a custom range
              </p>
            </div>
          ) : (
            // Calendar date picker view
            <>
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Pick a date range</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setShowMonths(true)}
                  >
                    Months
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingRange.from 
                    ? `From ${format(pendingRange.from, "d MMM")} — pick end date`
                    : "Click to select start date"}
                </p>
              </div>
              <Calendar
                mode="single"
                selected={pendingRange.from}
                onSelect={handleDateSelect}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={new Date().getFullYear()}
                defaultMonth={customDateRange?.from || new Date()}
              />
              {pendingRange.from && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setPendingRange({})}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
