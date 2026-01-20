import { Coins, Heart, TrendingUp, ScrollText, PieChart, Flame, Swords, FlaskConical, Sparkles, Calculator, BookOpen, CalendarDays, Hourglass, CalendarCheck, BarChart3 } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items with RPG theme colors
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "omscs", icon: Sparkles, label: "Arcane", color: "#06b6d4" },
  { id: "finances", icon: Coins, label: "Treasury", color: "#d4a574" },
  { id: "time", icon: Hourglass, label: "Quests", color: "#14b8a6" },
  { id: "fitness", icon: Heart, label: "Vitality", color: "#ef4444" },
];

// Finance tracker nav items - Treasury theme
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: TrendingUp, label: "Vault" },
  { id: "expenses", icon: ScrollText, label: "Ledger" },
  { id: "trends", icon: PieChart, label: "Fortune" },
];

// Health tracker nav items - Vitality theme
export const HEALTH_NAV_ITEMS: NavItem[] = [
  { id: "nutrition", icon: Flame, label: "Rations" },
  { id: "medication", icon: FlaskConical, label: "Potions" },
  { id: "activity", icon: Swords, label: "Training" },
];

// OMSCS tracker nav items - Arcane Studies theme
export const OMSCS_NAV_ITEMS: NavItem[] = [
  { id: "grades", icon: Calculator, label: "Runes" },
  { id: "semester", icon: CalendarDays, label: "Season" },
  { id: "courses", icon: BookOpen, label: "Tomes" },
];

// Time tracker nav items - Quest Log theme
export const TIME_NAV_ITEMS: NavItem[] = [
  { id: "calendar", icon: CalendarCheck, label: "Chronicle" },
  { id: "today", icon: Hourglass, label: "Today" },
  { id: "trends", icon: BarChart3, label: "Progress" },
];
