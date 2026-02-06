import type { Transaction, UserStats } from "@/lib/supabase";
import {
  EXPENSE_CATEGORIES,
  getTransactionBudgetType,
  DEFAULT_NEEDS_BUDGET,
  DEFAULT_WANTS_BUDGET,
} from "./constants";
import { getCurrentFDValue } from "./fdUtils";
import type { TimeFilter, DateRange } from "./types";

// Net worth calculation options for real-time values
export type NetWorthOptions = {
  mutualFundsValue?: number; // Real-time MF portfolio value (units × NAV)
};

// Net worth calculation - uses current FD value and optionally real-time MF value
export function calculateNetWorth(
  stats: UserStats | null,
  options?: NetWorthOptions,
): number {
  if (!stats) return 0;

  // Get current FD value with accrued interest instead of just principal
  const currentFDValue = getCurrentFDValue(stats.fixed_deposits || 0);

  // Use real-time MF value if provided, otherwise fall back to static value
  const mfValue = options?.mutualFundsValue ?? (stats.mutual_funds || 0);

  return (
    (stats.bank_savings || 0) +
    currentFDValue +
    mfValue +
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
export function isProratedInMonth(
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

// Category aggregation
export type CategoryTotal = {
  total: number;
  count: number;
  transactions: Transaction[];
};

export function getCategoryTotals(
  transactions: Transaction[],
  timeFilter: TimeFilter,
  options?: { excludeBudgetExcluded?: boolean; customRange?: DateRange; disableProrationSpreading?: boolean },
): Record<string, CategoryTotal> {
  const filtered = filterByTimeRange(
    transactions,
    timeFilter,
    options?.customRange,
    { disableProrationSpreading: options?.disableProrationSpreading },
  );

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
      // Use full amount when proration spreading is disabled, otherwise prorated amount
      const amount = options?.disableProrationSpreading ? txn.amount : getMonthlyAmount(txn);
      totals[cat].total += amount;
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
  options?: { excludeBudgetExcluded?: boolean; customRange?: DateRange; disableProrationSpreading?: boolean },
): CategoryTotalsByBudgetType {
  const filtered = filterByTimeRange(
    transactions,
    timeFilter,
    options?.customRange,
    { disableProrationSpreading: options?.disableProrationSpreading },
  );

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
      // Use full amount when proration spreading is disabled, otherwise prorated amount
      const amount = options?.disableProrationSpreading ? txn.amount : getMonthlyAmount(txn);
      bucket[cat].total += amount;
      bucket[cat].count += 1;
      bucket[cat].transactions.push(txn);
    }
  });

  return result;
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
    category: null,
    excluded_from_budget: false,
    details: null,
    created_at: now.toISOString(),
    prorate_months: null,
    budget_type: null, // auto-assign based on category
  };
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
  wantsBudget?: number | null,
): BudgetTypeInfo {
  const { startOfMonth } = getDateRanges();

  // Use provided budgets or fall back to defaults
  const actualNeedsBudget = needsBudget ?? DEFAULT_NEEDS_BUDGET;
  const actualWantsBudget = wantsBudget ?? DEFAULT_WANTS_BUDGET;

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
    needsPercent:
      actualNeedsBudget > 0 ? (needsSpent / actualNeedsBudget) * 100 : 0,
    wantsPercent:
      actualWantsBudget > 0 ? (wantsSpent / actualWantsBudget) * 100 : 0,
    totalPercent:
      totalBudget > 0 ? ((needsSpent + wantsSpent) / totalBudget) * 100 : 0,
  };
}
