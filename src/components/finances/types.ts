export type TimeFilter = "today" | "week" | "last30" | "custom";
export type ActiveView = "investments" | "expenses" | "trends";

export type DateRange = {
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
} | null;
