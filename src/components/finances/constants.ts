import {
  UtensilsCrossed,
  ShoppingBag,
  Clapperboard,
  Receipt,
  HeartPulse,
  Car,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { BudgetType } from "@/lib/supabase";

// Default budget values (used when user hasn't set custom values)
export const DEFAULT_NEEDS_BUDGET = 15000;
export const DEFAULT_WANTS_BUDGET = 10000;

// Category to budget type mapping (auto-assignment)
// Food defaults to "want" but user can override individual transactions
export const CATEGORY_BUDGET_TYPE: Record<string, BudgetType> = {
  // NEEDS - Essential expenses
  "Self Care": "need",
  Bills: "need",
  Investments: "need", // excluded from budget anyway
  // WANTS - Discretionary spending (user can override to "need" for groceries etc.)
  Food: "want",
  Shopping: "want",
  Entertainment: "want",
  Travel: "want",
};

// Budget type styling - monochromatic
export const BUDGET_TYPE_CONFIG: Record<
  BudgetType,
  {
    label: string;
    color: string;
    bgLight: string;
    bgDark: string;
  }
> = {
  need: {
    label: "Need",
    color: "#525252", // Neutral gray
    bgLight: "rgba(82, 82, 82, 0.1)",
    bgDark: "rgba(82, 82, 82, 0.2)",
  },
  want: {
    label: "Want",
    color: "#737373", // Neutral gray
    bgLight: "rgba(115, 115, 115, 0.1)",
    bgDark: "rgba(115, 115, 115, 0.2)",
  },
};

/**
 * Get the budget type for a transaction
 * Returns explicit budget_type if set, otherwise auto-assigns based on category
 */
export function getTransactionBudgetType(
  category: string | null,
  explicitBudgetType: BudgetType | null,
): BudgetType {
  // If explicitly set, use that
  if (explicitBudgetType) return explicitBudgetType;
  // Auto-assign based category, default to "want" for uncategorized
  return CATEGORY_BUDGET_TYPE[category ?? ""] ?? "want";
}

// Neo-brutalism pastel colors for each category
export const CATEGORY_PASTEL_COLORS: Record<string, string> = {
  "Self Care": "bg-pastel-pink",
  Bills: "bg-pastel-orange",
  Investments: "bg-pastel-green",
  Food: "bg-pastel-yellow",
  Shopping: "bg-pastel-blue",
  Entertainment: "bg-pastel-purple",
  Travel: "bg-pastel-green",
};

// Monochromatic category styling (legacy)
const CATEGORY_COLOR = "#737373"; // Neutral gray for all categories

export const EXPENSE_CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: "Food", icon: UtensilsCrossed },
  { name: "Self Care", icon: HeartPulse },
  { name: "Travel", icon: Car },
  { name: "Entertainment", icon: Clapperboard },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Bills", icon: Receipt },
  { name: "Investments", icon: TrendingUp },
];

// Categories that should auto-enable "exclude from budget"
export const EXCLUDED_CATEGORIES = ["Investments"];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Compact currency format for cards (1k, 2.5k, 1L, etc.)
export const formatCurrencyCompact = (amount: number) => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 100000) {
    // Lakhs: 1L, 1.5L, etc.
    const lakhs = absAmount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    // Thousands: 1k, 2.5k, 10k, etc.
    const thousands = absAmount / 1000;
    return `₹${
      thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    }k`;
  }

  // Regular format for smaller amounts (under 1000)
  return `₹${Math.round(absAmount)}`;
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const formatTime = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(":")) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const getCategoryColor = (_category: string): string => {
  return CATEGORY_COLOR;
};
