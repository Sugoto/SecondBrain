import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { Info, CalendarRange, CheckCheck } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { motion } from "framer-motion";
import { hapticFeedback } from "@/hooks/useHaptics";
import {
  formatDate,
  EXPENSE_CATEGORIES,
  CATEGORY_PASTEL_COLORS,
  getTransactionBudgetType,
} from "./constants";
import { useFormatCurrencyCompact } from "@/hooks/usePrivacy";

interface TransactionCardProps {
  transaction: Transaction;
  onClick: (transaction: Transaction) => void;
  index?: number;
}

export const TransactionCard = memo(function TransactionCard({
  transaction: txn,
  onClick,
  index = 0,
}: TransactionCardProps) {
  const fmt = useFormatCurrencyCompact();
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === txn.category);
  const CategoryIcon = cat?.icon;
  const categoryPastelColor = CATEGORY_PASTEL_COLORS[txn.category ?? ""] || "bg-pastel-blue";

  const isExcluded = txn.excluded_from_budget;

  const budgetType = getTransactionBudgetType(txn.category, txn.budget_type);
  const isNeed = budgetType === "need";

  const handleClick = useCallback(() => {
    hapticFeedback('light');
    onClick(txn);
  }, [onClick, txn]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        delay: Math.min(index * 0.015, 0.15),
        ease: [0.2, 0, 0, 1],
      }}
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors border ${
        isExcluded
          ? "opacity-50 bg-surface-container border-dashed border-outline-variant"
          : "bg-card border-outline-variant"
      }`}
    >
      {CategoryIcon && (
        <div
          className={`shrink-0 w-6 h-6 rounded-full ${categoryPastelColor} flex items-center justify-center relative`}
        >
          <CategoryIcon className="h-3 w-3 text-foreground" />
          {isNeed && !isExcluded && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full flex items-center justify-center bg-tertiary-container">
              <CheckCheck className="h-1 w-1" />
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p
            className={`text-xs font-bold truncate ${
              isExcluded ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {txn.category || "Uncategorized"}
          </p>
          {txn.details && (
            <Info className="h-2 w-2 shrink-0 text-muted-foreground" aria-label={txn.details} />
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <CalendarRange className="h-2 w-2 shrink-0 text-muted-foreground" aria-label={`Over ${txn.prorate_months} months`} />
          )}
        </div>
        <p className="text-[9px] font-medium text-muted-foreground truncate">
          {txn.merchant || "Unknown merchant"} · {formatDate(txn.date)}
        </p>
      </div>

      <span
        className={`font-mono text-xs font-bold shrink-0 text-right ${
          isExcluded ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        −{fmt(getMonthlyAmount(txn))}
      </span>
    </motion.button>
  );
});
