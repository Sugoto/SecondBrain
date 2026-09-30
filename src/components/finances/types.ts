export type TimeFilter = "today" | "week" | "month" | "custom";
export type ActiveView = "investments" | "expenses" | "trends";

// Custom date range for the "custom" filter
export type DateRange = {
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
} | null;
