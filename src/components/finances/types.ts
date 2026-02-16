export type TimeFilter = "today" | "week" | "month" | "custom";
export type ActiveView = "investments" | "expenses" | "trends";

// Custom date range for the "custom" filter
export type DateRange = {
  from: Date;
  to: Date;
} | null;

