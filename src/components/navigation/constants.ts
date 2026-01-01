import { Wallet, Heart, TrendingUp, Receipt, PieChart, Apple, Activity, Pill, GraduationCap, Calculator, BookOpen, CalendarDays, Clock, CalendarCheck, BarChart3 } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items with their theme colors
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "omscs", icon: GraduationCap, label: "OMSCS", color: "#06b6d4" },
  { id: "finances", icon: Wallet, label: "Finances", color: "#8b5cf6" },
  { id: "time", icon: Clock, label: "Time", color: "#14b8a6" },
  { id: "fitness", icon: Heart, label: "Health", color: "#ef4444" },
];

// Finance tracker nav items
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: TrendingUp, label: "Assets" },
  { id: "expenses", icon: Receipt, label: "Expenses" },
  { id: "trends", icon: PieChart, label: "Trends" },
];

// Health tracker nav items
export const HEALTH_NAV_ITEMS: NavItem[] = [
  { id: "nutrition", icon: Apple, label: "Nutrition" },
  { id: "medication", icon: Pill, label: "Medication" },
  { id: "activity", icon: Activity, label: "Activity" },
];

// OMSCS tracker nav items
export const OMSCS_NAV_ITEMS: NavItem[] = [
  { id: "grades", icon: Calculator, label: "Grades" },
  { id: "semester", icon: CalendarDays, label: "Semester" },
  { id: "courses", icon: BookOpen, label: "Courses" },
];

// Time tracker nav items
export const TIME_NAV_ITEMS: NavItem[] = [
  { id: "calendar", icon: CalendarCheck, label: "Calendar" },
  { id: "today", icon: Clock, label: "Today" },
  { id: "trends", icon: BarChart3, label: "Trends" },
];
