import {
  HandPlatter,
  Hamburger,
  Utensils,
  ShoppingBag,
  Gamepad2,
  Receipt,
  HeartPulse,
  ShoppingCart,
  Car,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const MONTHLY_BUDGET = 25000;

// Consolidated category theme data
const CATEGORY_THEMES: Record<string, { color: string; style: string }> = {
  Snacks: {
    color: "#eab308",
    style:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  Restaurants: {
    color: "#f97316",
    style:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  Meals: {
    color: "#14b8a6",
    style: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  Shopping: {
    color: "#ec4899",
    style: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
  Entertainment: {
    color: "#a855f7",
    style:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  Bills: {
    color: "#64748b",
    style:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  },
  Health: {
    color: "#10b981",
    style:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  Groceries: {
    color: "#84cc16",
    style: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  },
  Travel: {
    color: "#0ea5e9",
    style: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
  Investments: {
    color: "#6366f1",
    style:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
};

export const EXPENSE_CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: "Snacks", icon: Hamburger },
  { name: "Restaurants", icon: HandPlatter },
  { name: "Meals", icon: Utensils },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Entertainment", icon: Gamepad2 },
  { name: "Bills", icon: Receipt },
  { name: "Health", icon: HeartPulse },
  { name: "Groceries", icon: ShoppingCart },
  { name: "Travel", icon: Car },
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

export const getCategoryStyle = (category: string | null): string => {
  return (
    CATEGORY_THEMES[category ?? ""]?.style ?? "bg-muted text-muted-foreground"
  );
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_THEMES[category]?.color ?? "#94a3b8";
};
