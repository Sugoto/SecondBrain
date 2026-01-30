import {
  GraduationCap,
  Wallet,
  Activity,
  Landmark,
  Receipt,
  TrendingUp,
  Apple,
  Calculator,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "omscs", icon: GraduationCap, label: "OMSCS" },
  { id: "finances", icon: Wallet, label: "Finances" },
  { id: "fitness", icon: Activity, label: "Health" },
];

// Finance tracker nav items
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: Landmark, label: "Investments" },
  { id: "expenses", icon: Receipt, label: "Expenses" },
  { id: "trends", icon: TrendingUp, label: "Trends" },
];

// Health tracker nav items
export const HEALTH_NAV_ITEMS: NavItem[] = [
  { id: "nutrition", icon: Apple, label: "Nutrition" },
];

// OMSCS tracker nav items
export const OMSCS_NAV_ITEMS: NavItem[] = [
  { id: "grades", icon: Calculator, label: "Grades" },
  { id: "semester", icon: CalendarDays, label: "Semester" },
  { id: "courses", icon: BookOpen, label: "Courses" },
];
