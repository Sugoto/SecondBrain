export type AppSection = "home" | "finances" | "fitness";

export type ExpenseView = "trends" | "expenses" | "categories";
export type FitnessView = "dashboard" | "workouts" | "nutrition";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
