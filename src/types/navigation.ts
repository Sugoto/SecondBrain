export type AppSection = "home" | "omscs" | "finances" | "time" | "fitness";

export type FinanceView = "investments" | "expenses" | "trends";
export type HealthView = "nutrition";
export type OmscsView = "grades" | "semester" | "courses";
export type TimeView = "calendar" | "today" | "trends";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
