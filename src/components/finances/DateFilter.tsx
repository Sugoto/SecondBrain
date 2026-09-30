import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { MONTHS, fromDate, toDate, today } from "@/lib/utils";
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

const monthName = ({ month }: { month: number }) => MONTHS[month - 1];

const dayMonth = (date: Temporal.PlainDate) => `${date.day} ${monthName(date)}`;

const formatRange = (from: Temporal.PlainDate, to: Temporal.PlainDate) =>
  from.toPlainYearMonth().equals(to.toPlainYearMonth())
    ? `${from.day}–${dayMonth(to)}`
    : `${dayMonth(from)}–${dayMonth(to)}`;

function getRecentMonths() {
  const thisMonth = today().toPlainYearMonth();
  return Array.from({ length: 6 }, (_, i) => thisMonth.subtract({ months: i }));
}

export function DateFilter({
  activeView,
  timeFilter,
  customDateRange,
  onTimeFilterChange,
  onCustomDateRangeChange,
}: DateFilterProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<{
    from?: Temporal.PlainDate;
    to?: Temporal.PlainDate;
  }>({});

  const recentMonths = getRecentMonths();

  const handleMonthSelect = (month: Temporal.PlainYearMonth) => {
    onCustomDateRangeChange({
      from: month.toPlainDate({ day: 1 }),
      to: month.toPlainDate({ day: month.daysInMonth }),
    });
    onTimeFilterChange("custom");
    setPendingRange({});
    setFilterOpen(false);
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const date = fromDate(selected);
    if (!pendingRange.from) {
      setPendingRange({ from: date });
    } else if (!pendingRange.to) {
      const from = pendingRange.from;
      const to = date;
      if (Temporal.PlainDate.compare(to, from) >= 0) {
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
    const now = today();
    if (timeFilter === "today") return dayMonth(now);
    if (timeFilter === "week") {
      const weekStart = now.subtract({ days: now.dayOfWeek - 1 });
      return formatRange(weekStart, weekStart.add({ days: 6 }));
    }
    if (timeFilter === "custom" && customDateRange) {
      const { from, to } = customDateRange;
      if (
        from.day === 1 &&
        to.day === to.daysInMonth &&
        from.toPlainYearMonth().equals(to.toPlainYearMonth())
      ) {
        return monthName(from);
      }
      return formatRange(from, to);
    }
    return monthName(now);
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
        <button className="ui-type inline-flex h-9 items-center gap-2 rounded-[9px] border border-[var(--ui-edge)] bg-[var(--ui-panel)] px-3 text-[var(--ui-ink-soft)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)]">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="ui-num text-[12px]">{getFilterLabel()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl border border-outline-variant bg-background shadow-2xl"
        align="end"
      >
        <div className="p-5 space-y-5 min-w-[280px]">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
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
                  className={`h-9 text-[10px] uppercase tracking-wider transition-colors ${
                    timeFilter === filter
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TIME_LABELS[filter]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              Recent months
            </p>
            <div className="grid grid-cols-3 gap-2">
              {recentMonths.map((month) => (
                <button
                  key={month.toString()}
                  onClick={() => handleMonthSelect(month)}
                  className="h-8 text-[11px] uppercase tracking-wider border border-outline-variant rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {monthName(month)}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/60 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              {pendingRange.from
                ? `From ${dayMonth(pendingRange.from)} — pick end`
                : "Custom range"}
            </p>
            <Calendar
              mode="single"
              selected={pendingRange.from && toDate(pendingRange.from)}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(today().year, 11)}
              defaultMonth={toDate(customDateRange?.from ?? today())}
              className="rounded-xl border border-outline-variant"
            />
            {pendingRange.from && (
              <button
                onClick={() => setPendingRange({})}
                className="w-full h-8 mt-3 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
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
