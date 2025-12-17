import { Wallet, Dumbbell, TrendingUp, LayoutGrid } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "finances", icon: Wallet, label: "Finances" },
  { id: "fitness", icon: Dumbbell, label: "Fitness" },
];

// Finance tracker nav items
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: TrendingUp, label: "Investments" },
  { id: "expenses", icon: Wallet, label: "Expenses" },
  { id: "trends", icon: LayoutGrid, label: "Trends" },
];
