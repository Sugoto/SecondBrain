import type { Transaction, UserStats } from "@/lib/supabase";
import { TIME_ZONE, today } from "@/lib/utils";
import type { TimeFilter, DateRange } from "./types";

export function calculateNetWorth(stats: UserStats | null): number {
  if (!stats) return 0;
  return stats.bank_savings + stats.mutual_funds + stats.us_etfs + stats.ppf + stats.epf;
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
function isProratedInMonth(txn: Transaction, targetMonth: Temporal.PlainDate): boolean {
  const target = targetMonth.toPlainYearMonth();
  const startMonth = Temporal.PlainDate.from(txn.date).toPlainYearMonth();

  if (!txn.prorate_months || txn.prorate_months <= 1) {
    // Not prorated - just check if date is in the month
    return startMonth.equals(target);
  }

  // Prorated - check if targetMonth falls within the proration window
  const endMonth = startMonth.add({ months: txn.prorate_months - 1 });
  return (
    Temporal.PlainYearMonth.compare(target, startMonth) >= 0 &&
    Temporal.PlainYearMonth.compare(target, endMonth) <= 0
  );
}

// Date range helpers - centralized to avoid duplication
function getDateRanges() {
  const now = today();
  return {
    today: now,
    startOfWeek: now.subtract({ days: now.dayOfWeek - 1 }),
    startOfMonth: now.with({ day: 1 }),
  };
}

export function filterByTimeRange(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  customRange?: DateRange,
  options?: { disableProrationSpreading?: boolean },
): Transaction[] {
  const { today: startOfDay, startOfWeek, startOfMonth } = getDateRanges();

  return transactions.filter((txn) => {
    const txnDate = Temporal.PlainDate.from(txn.date);

    // Handle custom date range
    if (timeFilter === "custom" && customRange) {
      return (
        Temporal.PlainDate.compare(txnDate, customRange.from) >= 0 &&
        Temporal.PlainDate.compare(txnDate, customRange.to) <= 0
      );
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
        return Temporal.PlainDate.compare(txnDate, startOfDay) >= 0;
      case "week":
        return Temporal.PlainDate.compare(txnDate, startOfWeek) >= 0;
      case "month":
        return Temporal.PlainDate.compare(txnDate, startOfMonth) >= 0;
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
    let comparison: number;
    if (sortBy === "date") {
      comparison = Temporal.PlainDate.compare(a.date, b.date);
      if (comparison === 0 && a.time && b.time) {
        comparison = a.time.localeCompare(b.time);
      }
    } else {
      comparison = a.amount - b.amount;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
}

// Create empty transaction template
export function createEmptyTransaction(): Transaction {
  return {
    id: "",
    amount: 0,
    merchant: "",
    date: today().toString(),
    time: Temporal.Now.plainTimeISO(TIME_ZONE).toString({ smallestUnit: "second" }),
    value_rating: 3,
    excluded_from_budget: false,
    details: null,
    created_at: new Date().toISOString(),
    prorate_months: null,
    bank_account: null,
    card_number: null,
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

    return Temporal.PlainDate.compare(t.date, startOfMonth) >= 0;
  });

  const spent = monthlyTransactions.reduce((sum, t) => sum + getMonthlyAmount(t), 0);

  return {
    spent,
    budget,
    remaining: Math.max(0, budget - spent),
    percent: budget > 0 ? (spent / budget) * 100 : 0,
  };
}
