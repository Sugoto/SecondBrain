export type AppSection = "home" | "finances" | "fitness";

export type ExpenseView = "trends" | "expenses" | "categories";
export type HealthView = "nutrition" | "workouts";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
