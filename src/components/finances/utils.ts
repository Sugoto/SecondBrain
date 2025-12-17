import type { Transaction, UserStats } from "@/lib/supabase";
import { EXPENSE_CATEGORIES } from "./constants";
import type { TimeFilter, DateRange } from "./types";

// Net worth calculation
export function calculateNetWorth(stats: UserStats | null): number {
  if (!stats) return 0;
  return (
    (stats.bank_savings || 0) +
    (stats.fixed_deposits || 0) +
    (stats.mutual_funds || 0) +
    (stats.ppf || 0) +
    (stats.epf || 0)
  );
}

// Proration helpers
/**
 * Get the monthly amount for a transaction (handles proration)
 */
export function getMonthlyAmount(txn: Transaction): number {
  if (txn.prorate_months && txn.prorate_months > 1) {
    return txn.amount / txn.prorate_months;
  }
  return txn.amount;
}

/**
 * Check if a prorated transaction applies to a given month
 */
export function isProratedInMonth(txn: Transaction, targetMonth: Date): boolean {
  if (!txn.prorate_months || txn.prorate_months <= 1) {
    // Not prorated - just check if date is in the month
    const txnDate = new Date(txn.date);
    return (
      txnDate.getFullYear() === targetMonth.getFullYear() &&
      txnDate.getMonth() === targetMonth.getMonth()
    );
  }

  // Prorated - check if targetMonth falls within the proration window
  const txnDate = new Date(txn.date);
  const startMonth = new Date(txnDate.getFullYear(), txnDate.getMonth(), 1);
  const endMonth = new Date(startMonth);
  endMonth.setMonth(endMonth.getMonth() + txn.prorate_months - 1);

  const targetStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  return targetStart >= startMonth && targetStart <= endMonth;
}

// Date range helpers - centralized to avoid duplication
export function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return { now, today, startOfWeek, startOfMonth };
}

export function filterByTimeRange(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  customRange?: DateRange
): Transaction[] {
  const { today, startOfWeek, startOfMonth } = getDateRanges();
  
  return transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    
    // Handle custom date range
    if (timeFilter === "custom" && customRange) {
      const from = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
      const to = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate(), 23, 59, 59);
      return txnDate >= from && txnDate <= to;
    }
    
    // For prorated transactions in "month" view, check if proration period overlaps
    if (timeFilter === "month" && txn.prorate_months && txn.prorate_months > 1) {
      return isProratedInMonth(txn, startOfMonth);
    }
    
    switch (timeFilter) {
      case "today":
        return txnDate >= today;
      case "week":
        return txnDate >= startOfWeek;
      case "month":
        return txnDate >= startOfMonth;
      case "custom":
        // If custom but no range, return all
        return true;
      default:
        return true;
    }
  });
}

export function sortTransactions(
  transactions: Transaction[],
  sortBy: "date" | "amount",
  sortOrder: "asc" | "desc"
): Transaction[] {
  return [...transactions].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (comparison === 0 && a.time && b.time) {
        comparison = a.time.localeCompare(b.time);
      }
    } else {
      comparison = a.amount - b.amount;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
}

// Category aggregation
export type CategoryTotal = {
  total: number;
  count: number;
  transactions: Transaction[];
};

export function getCategoryTotals(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  options?: { excludeBudgetExcluded?: boolean; customRange?: DateRange }
): Record<string, CategoryTotal> {
  const filtered = filterByTimeRange(transactions, timeFilter, options?.customRange);
  
  const totals: Record<string, CategoryTotal> = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    totals[cat.name] = { total: 0, count: 0, transactions: [] };
  });
  totals["Uncategorized"] = { total: 0, count: 0, transactions: [] };

  filtered.forEach((txn) => {
    // Skip budget-excluded transactions if option is set
    if (options?.excludeBudgetExcluded && txn.excluded_from_budget) {
      return;
    }
    
    const cat = txn.category || "Uncategorized";
    if (totals[cat]) {
      // Use prorated amount for totals
      totals[cat].total += getMonthlyAmount(txn);
      totals[cat].count += 1;
      totals[cat].transactions.push(txn);
    }
  });

  return totals;
}

// Budget calculations
export function calculateBudgetInfo(totalExpenses: number, monthlyBudget: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = lastDayOfMonth - currentDay + 1;
  
  const totalRemaining = Math.max(0, monthlyBudget - totalExpenses);
  const dailyBudget = daysRemaining > 0 ? totalRemaining / daysRemaining : 0;
  const percentUsed = (totalExpenses / monthlyBudget) * 100;
  
  return { dailyBudget, totalRemaining, percentUsed, daysRemaining };
}

// Create empty transaction template
export function createEmptyTransaction(): Transaction {
  const now = new Date();
  return {
    id: "",
    amount: 0,
    merchant: "",
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().slice(0, 8),
    type: "expense",
    account: null,
    upi_ref: null,
    category: null,
    excluded_from_budget: false,
    details: null,
    created_at: now.toISOString(),
    prorate_months: null,
  };
}

// Natural language spending summary generator
type CategorySummary = {
  name: string;
  total: number;
  count: number;
  percentage: number;
};

const TIME_PERIOD_LABELS: Record<TimeFilter, { past: string; period: string }> = {
  today: { past: "Today", period: "today" },
  week: { past: "This week", period: "this week" },
  month: { past: "This month", period: "this month" },
  custom: { past: "In this period", period: "in this period" },
};

// More natural phrases for categories
const CATEGORY_PHRASES: Record<string, { action: string; noun: string }> = {
  "Eating Out": { action: "eating out", noun: "food outside" },
  "Food Delivery": { action: "ordering in", noun: "food delivery" },
  "Shopping": { action: "shopping", noun: "shopping" },
  "Entertainment": { action: "entertainment", noun: "fun stuff" },
  "Bills": { action: "bills", noun: "bills" },
  "Health": { action: "health", noun: "health" },
  "Groceries": { action: "groceries", noun: "groceries" },
  "Travel": { action: "travel", noun: "getting around" },
  "Investments": { action: "investments", noun: "investments" },
  "Uncategorized": { action: "other things", noun: "miscellaneous" },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `₹${Math.round(amount)}`;
}

// Empty state messages by time filter
const EMPTY_STATE_MESSAGES: Record<TimeFilter, string[]> = {
  today: [
    "Nothing spent today, off to a good start!",
    "No expenses yet today. Keeping it light!",
    "Today's a no-spend day so far.",
    "Clean slate today, no spending recorded.",
    "Wallet's untouched today!",
  ],
  week: [
    "No spending this week yet.",
    "This week's looking expense-free so far.",
    "Nothing recorded this week, nice and quiet.",
    "A peaceful week for your wallet.",
  ],
  month: [
    "No expenses recorded this month.",
    "This month is starting fresh, no spending yet.",
    "Nothing spent this month so far.",
    "Your wallet's had a quiet month.",
  ],
  custom: [
    "No expenses found in this date range.",
    "Nothing recorded for these dates.",
    "No spending data for this period.",
  ],
};

export function generateSpendingSummary(
  categoryTotals: Record<string, CategoryTotal>,
  timeFilter: TimeFilter,
  formatCurrency: (amount: number) => string
): string {
  // Get sorted categories by total (descending)
  const categories: CategorySummary[] = Object.entries(categoryTotals)
    .filter(([, data]) => data.count > 0)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      percentage: 0,
    }));

  // Empty state with variety
  if (categories.length === 0) {
    return pickRandom(EMPTY_STATE_MESSAGES[timeFilter]);
  }

  const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);
  
  // Calculate percentages
  categories.forEach((c) => {
    c.percentage = (c.total / grandTotal) * 100;
  });

  // Sort by total descending
  categories.sort((a, b) => b.total - a.total);

  const { past, period } = TIME_PERIOD_LABELS[timeFilter];
  const topCategory = categories[0];
  const secondCategory = categories[1];
  const topPhrase = CATEGORY_PHRASES[topCategory.name] || { action: topCategory.name.toLowerCase(), noun: topCategory.name.toLowerCase() };

  // Build the summary parts
  const parts: string[] = [];

  // Opening with total - conversational
  const openingVariants = [
    `${past}, you've spent ${formatCurrency(grandTotal)}.`,
    `You spent ${formatCurrency(grandTotal)} ${period}.`,
    `${formatCurrency(grandTotal)} spent ${period}.`,
    `Looks like ${formatCurrency(grandTotal)} went out ${period}.`,
  ];
  parts.push(pickRandom(openingVariants));

  // Top category insight - conversational phrasing
  if (topCategory.percentage >= 40) {
    const bigSpendPhrases = [
      `Most of it was ${topPhrase.action} at ${formatCompactCurrency(topCategory.total)}.`,
      `${topCategory.name} took the biggest share at ${formatCompactCurrency(topCategory.total)}.`,
      `${formatCompactCurrency(topCategory.total)} of that went to ${topPhrase.noun}.`,
      `A good chunk went to ${topPhrase.action}, around ${formatCompactCurrency(topCategory.total)}.`,
    ];
    parts.push(pickRandom(bigSpendPhrases));
  } else {
    const topPhrases = [
      `${topCategory.name} was the biggest at ${formatCompactCurrency(topCategory.total)}.`,
      `You spent ${formatCompactCurrency(topCategory.total)} on ${topPhrase.action}.`,
      `${topPhrase.noun} came in highest at ${formatCompactCurrency(topCategory.total)}.`,
    ];
    parts.push(pickRandom(topPhrases));
  }

  // Second category if significant
  if (secondCategory && secondCategory.percentage >= 15) {
    const secondPhrase = CATEGORY_PHRASES[secondCategory.name] || { action: secondCategory.name.toLowerCase(), noun: secondCategory.name.toLowerCase() };
    const secondPhrases = [
      `${secondCategory.name} followed with ${formatCompactCurrency(secondCategory.total)}.`,
      `You also spent ${formatCompactCurrency(secondCategory.total)} on ${secondPhrase.action}.`,
      `Another ${formatCompactCurrency(secondCategory.total)} went to ${secondPhrase.noun}.`,
    ];
    parts.push(pickRandom(secondPhrases));
  }

  return parts.join(" ");
}

