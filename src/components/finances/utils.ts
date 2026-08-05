import type { Transaction, UserStats } from "@/lib/supabase";
import type { TimeFilter, DateRange } from "./types";

export function calculateNetWorth(stats: UserStats | null): number {
  if (!stats) return 0;
  return (
    stats.bank_savings +
    stats.mutual_funds +
    stats.us_etfs +
    stats.ppf +
    stats.epf
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
function isProratedInMonth(
  txn: Transaction,
  targetMonth: Date,
): boolean {
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

  const targetStart = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    1,
  );
  return targetStart >= startMonth && targetStart <= endMonth;
}

// Date range helpers - centralized to avoid duplication
function getDateRanges() {
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
  customRange?: DateRange,
  options?: { disableProrationSpreading?: boolean },
): Transaction[] {
  const { today, startOfWeek, startOfMonth } = getDateRanges();

  return transactions.filter((txn) => {
    const txnDate = new Date(txn.date);

    // Handle custom date range
    if (timeFilter === "custom" && customRange) {
      const from = new Date(
        customRange.from.getFullYear(),
        customRange.from.getMonth(),
        customRange.from.getDate(),
      );
      const to = new Date(
        customRange.to.getFullYear(),
        customRange.to.getMonth(),
        customRange.to.getDate(),
        23,
        59,
        59,
      );
      return txnDate >= from && txnDate <= to;
    }

    // For prorated transactions in "month" view, check if proration period overlaps
    // (unless proration spreading is disabled)
    if (
      !options?.disableProrationSpreading &&
      timeFilter === "month" &&
      txn.prorate_months &&
      txn.prorate_months > 1
    ) {
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
  sortOrder: "asc" | "desc",
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

// Grouped totals (used for value-rating breakdown)
export type GroupTotal = {
  total: number;
  count: number;
  transactions: Transaction[];
};

// Value rating buckets, highest to lowest, with "Unrated" last
export const VALUE_RATING_KEYS = ["5", "4", "3", "2", "1", "Unrated"] as const;

export function getValueRatingTotals(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  options?: { excludeBudgetExcluded?: boolean; customRange?: DateRange; disableProrationSpreading?: boolean },
): Record<string, GroupTotal> {
  const filtered = filterByTimeRange(
    transactions,
    timeFilter,
    options?.customRange,
    { disableProrationSpreading: options?.disableProrationSpreading },
  );

  const totals: Record<string, GroupTotal> = {};
  VALUE_RATING_KEYS.forEach((key) => {
    totals[key] = { total: 0, count: 0, transactions: [] };
  });

  filtered.forEach((txn) => {
    // Skip budget-excluded transactions if option is set
    if (options?.excludeBudgetExcluded && txn.excluded_from_budget) {
      return;
    }

    const key = txn.value_rating ? String(txn.value_rating) : "Unrated";
    // Use full amount when proration spreading is disabled, otherwise prorated amount
    const amount = options?.disableProrationSpreading ? txn.amount : getMonthlyAmount(txn);
    totals[key].total += amount;
    totals[key].count += 1;
    totals[key].transactions.push(txn);
  });

  return totals;
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
    value_rating: 3,
    excluded_from_budget: false,
    details: null,
    created_at: now.toISOString(),
    prorate_months: null,
  };
}

// Unified budget calculations
export type BudgetInfo = {
  spent: number;
  budget: number;
  remaining: number;
  percent: number;
};

/**
 * Calculate spending against the single monthly budget.
 * Only considers budget-included expenses for the current month.
 */
export function calculateBudgetInfo(
  transactions: Transaction[],
  monthlyBudget?: number | null,
): BudgetInfo {
  const { startOfMonth } = getDateRanges();

  const budget = monthlyBudget ?? 0;

  // Filter to current month, expenses only, budget-included
  const monthlyTransactions = transactions.filter((t) => {
    if (t.excluded_from_budget) return false;

    // Handle prorated transactions
    if (t.prorate_months && t.prorate_months > 1) {
      return isProratedInMonth(t, startOfMonth);
    }

    const txnDate = new Date(t.date);
    return txnDate >= startOfMonth;
  });

  const spent = monthlyTransactions.reduce(
    (sum, t) => sum + getMonthlyAmount(t),
    0,
  );

  return {
    spent,
    budget,
    remaining: Math.max(0, budget - spent),
    percent: budget > 0 ? (spent / budget) * 100 : 0,
  };
}
