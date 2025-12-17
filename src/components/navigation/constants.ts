import { Wallet, Heart, TrendingUp, Receipt, PieChart } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items with their theme colors
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "finances", icon: Wallet, label: "Finances", color: "#8b5cf6" },
  { id: "fitness", icon: Heart, label: "Health", color: "#ef4444" },
];

// Finance tracker nav items
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: TrendingUp, label: "Investments" },
  { id: "expenses", icon: Receipt, label: "Expenses" },
  { id: "trends", icon: PieChart, label: "Trends" },
];
