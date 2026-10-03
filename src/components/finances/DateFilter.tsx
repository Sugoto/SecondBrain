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
  last30: "30 days",
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
    return TIME_LABELS.last30;
  };

  if (activeView === "trends") return null;

  return (
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger className="ui-type inline-flex h-9 items-center gap-2 rounded-[9px] border border-[var(--ui-edge)] bg-[var(--ui-panel)] px-3 text-[var(--ui-ink-soft)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)]">
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="ui-num text-[12px]">{getFilterLabel()}</span>
      </PopoverTrigger>
      <PopoverContent
        className="ui-type w-[min(320px,calc(100vw-2rem))] rounded-[18px] border border-[var(--ui-edge)] bg-[var(--ui-panel)] p-4 shadow-[var(--ui-lift)]"
        align="end"
      >
        <div role="group" aria-label="Quick range" className="ui-inset grid grid-cols-3 gap-1 p-1">
          {(["today", "week", "last30"] as const).map((filter) => {
            const active = timeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onTimeFilterChange(filter);
                  setFilterOpen(false);
                }}
                className={`h-9 rounded-[7px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)] ${
                  active
                    ? "bg-[var(--ui-panel)] font-medium text-[var(--ui-accent)] shadow-[var(--ui-lift)]"
                    : "text-[var(--ui-ink-softer)] hover:text-[var(--ui-ink)]"
                }`}
              >
                {TIME_LABELS[filter]}
              </button>
            );
          })}
        </div>

        <h3 className="mt-4 text-[13px] font-medium text-[var(--ui-accent)]">Months</h3>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {recentMonths.map((month) => {
            const active =
              timeFilter === "custom" &&
              customDateRange !== null &&
              customDateRange.from.equals(month.toPlainDate({ day: 1 })) &&
              customDateRange.to.equals(month.toPlainDate({ day: month.daysInMonth }));
            return (
              <button
                key={month.toString()}
                type="button"
                aria-pressed={active}
                onClick={() => handleMonthSelect(month)}
                className={`h-9 rounded-full text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)] ${
                  active
                    ? "ui-chip justify-center font-medium"
                    : "text-[var(--ui-ink-soft)] hover:bg-[var(--ui-inset)] hover:text-[var(--ui-ink)]"
                }`}
              >
                {monthName(month)}
              </button>
            );
          })}
        </div>

        <h3 className="mt-4 text-[13px] font-medium text-[var(--ui-accent)]">Custom range</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["from", "to"] as const).map((edge) => (
            <label key={edge} className="block">
              <span className="text-[12px] text-[var(--ui-ink-softer)]">
                {edge === "from" ? "From" : "To"}
              </span>
              <input
                type="date"
                className="ui-inset ui-num mt-1 h-11 w-full px-3 text-[14px] text-[var(--ui-ink)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
                value={range[edge].toString()}
                onChange={(e) => handleDateChange(edge, e.target.value)}
              />
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
