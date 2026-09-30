import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { MONTHS, today } from "@/lib/utils";
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

  const recentMonths = getRecentMonths();

  const handleMonthSelect = (month: Temporal.PlainYearMonth) => {
    onCustomDateRangeChange({
      from: month.toPlainDate({ day: 1 }),
      to: month.toPlainDate({ day: month.daysInMonth }),
    });
    onTimeFilterChange("custom");
    setFilterOpen(false);
  };

  const range = customDateRange ?? { from: today(), to: today() };

  const handleDateChange = (edge: "from" | "to", value: string) => {
    if (!value) return;
    const date = Temporal.PlainDate.from(value);
    const [from, to] = edge === "from" ? [date, range.to] : [range.from, date];
    onCustomDateRangeChange(
      Temporal.PlainDate.compare(from, to) <= 0 ? { from, to } : { from: to, to: from },
    );
    onTimeFilterChange("custom");
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
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger className="ui-type inline-flex h-9 items-center gap-2 rounded-[9px] border border-[var(--ui-edge)] bg-[var(--ui-panel)] px-3 text-[var(--ui-ink-soft)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)]">
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="ui-num text-[12px]">{getFilterLabel()}</span>
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
              Custom range
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["from", "to"] as const).map((edge) => (
                <input
                  key={edge}
                  type="date"
                  aria-label={edge === "from" ? "From date" : "To date"}
                  className="ui-inset ui-num h-11 w-full px-3 text-[14px] text-[var(--ui-ink)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
                  value={range[edge].toString()}
                  onChange={(e) => handleDateChange(edge, e.target.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
