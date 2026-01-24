import { Coins, Heart, Landmark, ScrollText, PieChart, Flame, Scroll, Calculator, BookOpen, CalendarDays } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";

// Home page nav items with RPG theme colors
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "omscs", icon: Scroll, label: "University", color: "#06b6d4" },
  { id: "finances", icon: Coins, label: "Treasury", color: "#8b5cf6" },
  { id: "fitness", icon: Heart, label: "Vitality", color: "#ef4444" },
];

// Finance tracker nav items - Treasury theme
export const FINANCE_NAV_ITEMS: NavItem[] = [
  { id: "investments", icon: Landmark, label: "Vault" },
  { id: "expenses", icon: ScrollText, label: "Ledger" },
  { id: "trends", icon: PieChart, label: "Fortune" },
];

// Health tracker nav items - Vitality theme
export const HEALTH_NAV_ITEMS: NavItem[] = [
  { id: "nutrition", icon: Flame, label: "Rations" },
];

// OMSCS tracker nav items - Arcane Studies theme
export const OMSCS_NAV_ITEMS: NavItem[] = [
  { id: "grades", icon: Calculator, label: "Runes" },
  { id: "semester", icon: CalendarDays, label: "Season" },
  { id: "courses", icon: BookOpen, label: "Tomes" },
];
