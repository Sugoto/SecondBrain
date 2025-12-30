import type { Transaction, UserStats } from "@/lib/supabase";
import { EXPENSE_CATEGORIES, getTransactionBudgetType, DEFAULT_NEEDS_BUDGET, DEFAULT_WANTS_BUDGET } from "./constants";
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

// Calculate average monthly savings from transaction history and income
export function calculateMonthlySavings(
  transactions: Transaction[],
  monthlyIncome: number | null
): { monthlySavings: number } {
  // Use monthly income as the base
  const income = monthlyIncome || 0;
  
  if (!transactions.length || income === 0) {
    // No data - assume 30% savings rate
    return { monthlySavings: income * 0.3 };
  }

  // Get transactions from last 3 months for expense average
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  const recentTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    return txnDate >= threeMonthsAgo && txn.type === "expense";
  });

  if (!recentTransactions.length) {
    return { monthlySavings: income * 0.3 };
  }

  // Group expenses by month (excluding investments - they're savings, not expenses)
  const monthlyExpenses: Record<string, number> = {};
  
  recentTransactions.forEach((txn) => {
    if (txn.category === "Investments") return; // Investments are savings
    
    const date = new Date(txn.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + txn.amount;
  });

  const months = Object.values(monthlyExpenses);
  if (months.length === 0) {
    return { monthlySavings: income * 0.3 };
  }

  const avgExpenses = months.reduce((sum, exp) => sum + exp, 0) / months.length;
  const monthlySavings = Math.max(0, income - avgExpenses);

  return { monthlySavings };
}

// Calculate time to reach target net worth using compound growth with monthly contributions
export function calculateTimeToGoal(
  currentNetWorth: number,
  monthlySavings: number,
  targetNetWorth: number = 10000000, // 1 Crore default
  annualReturnRate: number = 0.12 // 12% default
): { months: number; years: number; remainingMonths: number; targetDate: Date } | null {
  // Already at or above target
  if (currentNetWorth >= targetNetWorth) {
    return { months: 0, years: 0, remainingMonths: 0, targetDate: new Date() };
  }

  // No savings means we can't reach the goal through investing
  if (monthlySavings <= 0) {
    return null;
  }

  const monthlyRate = annualReturnRate / 12;
  const target = targetNetWorth;
  const principal = currentNetWorth;
  const pmt = monthlySavings;

  // Binary search for n (months) where:
  // FV = P(1+r)^n + PMT × ((1+r)^n - 1) / r >= target
  let low = 1;
  let high = 600; // Max 50 years
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const growthFactor = Math.pow(1 + monthlyRate, mid);
    const futureValue = principal * growthFactor + pmt * ((growthFactor - 1) / monthlyRate);
    
    if (futureValue >= target) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  // Verify the result
  const months = low;
  const growthFactor = Math.pow(1 + monthlyRate, months);
  const finalValue = principal * growthFactor + pmt * ((growthFactor - 1) / monthlyRate);
  
  if (finalValue < target) {
    return null; // Can't reach goal within 50 years
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return { months, years, remainingMonths, targetDate };
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

// Get category totals grouped by budget type (needs vs wants)
// This considers manual budget_type overrides on individual transactions
export type CategoryTotalsByBudgetType = {
  needs: Record<string, CategoryTotal>;
  wants: Record<string, CategoryTotal>;
};

export function getCategoryTotalsByBudgetType(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  options?: { excludeBudgetExcluded?: boolean; customRange?: DateRange }
): CategoryTotalsByBudgetType {
  const filtered = filterByTimeRange(transactions, timeFilter, options?.customRange);
  
  const result: CategoryTotalsByBudgetType = {
    needs: {},
    wants: {},
  };
  
  // Initialize all categories in both buckets
  EXPENSE_CATEGORIES.forEach((cat) => {
    result.needs[cat.name] = { total: 0, count: 0, transactions: [] };
    result.wants[cat.name] = { total: 0, count: 0, transactions: [] };
  });
  result.needs["Uncategorized"] = { total: 0, count: 0, transactions: [] };
  result.wants["Uncategorized"] = { total: 0, count: 0, transactions: [] };

  filtered.forEach((txn) => {
    // Skip budget-excluded transactions if option is set
    if (options?.excludeBudgetExcluded && txn.excluded_from_budget) {
      return;
    }
    
    const cat = txn.category || "Uncategorized";
    // Use the actual budget type (considering manual override)
    const budgetType = getTransactionBudgetType(cat, txn.budget_type);
    const bucket = budgetType === "need" ? result.needs : result.wants;
    
    if (bucket[cat]) {
      bucket[cat].total += getMonthlyAmount(txn);
      bucket[cat].count += 1;
      bucket[cat].transactions.push(txn);
    }
  });

  return result;
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
    budget_type: null, // auto-assign based on category
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
  "Snacks": { action: "snacking", noun: "snacks" },
  "Restaurants": { action: "dining out", noun: "restaurant meals" },
  "Meals": { action: "eating", noun: "meals" },
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

// Budget type calculations
export type BudgetTypeInfo = {
  needsSpent: number;
  wantsSpent: number;
  needsBudget: number;
  wantsBudget: number;
  needsRemaining: number;
  wantsRemaining: number;
  needsPercent: number;
  wantsPercent: number;
  totalPercent: number;
};

/**
 * Calculate spending totals by budget type (needs vs wants)
 * Only considers budget-included expenses for the current month
 */
export function calculateBudgetTypeInfo(
  transactions: Transaction[],
  needsBudget?: number | null,
  wantsBudget?: number | null
): BudgetTypeInfo {
  const { startOfMonth } = getDateRanges();
  
  // Use provided budgets or fall back to defaults
  const actualNeedsBudget = needsBudget ?? DEFAULT_NEEDS_BUDGET;
  const actualWantsBudget = wantsBudget ?? DEFAULT_WANTS_BUDGET;
  
  // Filter to current month, expenses only, budget-included
  const monthlyTransactions = transactions.filter((t) => {
    if (t.type !== "expense" || t.excluded_from_budget) return false;
    
    // Handle prorated transactions
    if (t.prorate_months && t.prorate_months > 1) {
      return isProratedInMonth(t, startOfMonth);
    }
    
    const txnDate = new Date(t.date);
    return txnDate >= startOfMonth;
  });
  
  let needsSpent = 0;
  let wantsSpent = 0;
  
  monthlyTransactions.forEach((t) => {
    const budgetType = getTransactionBudgetType(t.category, t.budget_type);
    const amount = getMonthlyAmount(t);
    
    if (budgetType === "need") {
      needsSpent += amount;
    } else {
      wantsSpent += amount;
    }
  });
  
  const totalBudget = actualNeedsBudget + actualWantsBudget;
  
  return {
    needsSpent,
    wantsSpent,
    needsBudget: actualNeedsBudget,
    wantsBudget: actualWantsBudget,
    needsRemaining: Math.max(0, actualNeedsBudget - needsSpent),
    wantsRemaining: Math.max(0, actualWantsBudget - wantsSpent),
    needsPercent: actualNeedsBudget > 0 ? (needsSpent / actualNeedsBudget) * 100 : 0,
    wantsPercent: actualWantsBudget > 0 ? (wantsSpent / actualWantsBudget) * 100 : 0,
    totalPercent: totalBudget > 0 ? ((needsSpent + wantsSpent) / totalBudget) * 100 : 0,
  };
}

