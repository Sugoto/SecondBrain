import { Wallet, Dumbbell, TrendingUp, LayoutGrid } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "expenses", icon: Wallet, label: "Expenses" },
  { id: "fitness", icon: Dumbbell, label: "Fitness" },
];

// Expense tracker nav items
export const EXPENSE_NAV_ITEMS: NavItem[] = [
  { id: "trends", icon: TrendingUp, label: "Trends" },
  { id: "expenses", icon: Wallet, label: "Expenses" },
  { id: "categories", icon: LayoutGrid, label: "Categories" },
];

