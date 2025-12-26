export type AppSection = "home" | "omscs" | "finances" | "fitness";

export type FinanceView = "investments" | "expenses" | "trends";
export type HealthView = "nutrition" | "activity" | "medication";
export type OmscsView = "grades" | "semester" | "courses";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
