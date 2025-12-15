export type TimeFilter = "today" | "week" | "month" | "custom";
export type ActiveView = "trends" | "expenses" | "categories";
export type ChartMode = "daily" | "monthly";

// Custom date range for the "custom" filter
export type DateRange = {
  from: Date;
  to: Date;
} | null;
