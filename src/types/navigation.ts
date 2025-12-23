export type AppSection = "home" | "omscs" | "finances" | "fitness";

export type FinanceView = "investments" | "expenses" | "trends";
export type HealthView = "nutrition" | "workouts" | "medication";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
