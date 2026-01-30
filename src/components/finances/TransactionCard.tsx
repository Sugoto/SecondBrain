import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { ChevronRight, Info, CalendarRange, CheckCheck } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { motion } from "framer-motion";
import { hapticFeedback } from "@/hooks/useHaptics";
import {
  formatDate,
  formatTime,
  formatCurrencyCompact,
  EXPENSE_CATEGORIES,
  getTransactionBudgetType,
} from "./constants";

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
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === txn.category);
  const CategoryIcon = cat?.icon;

  const isExcluded = txn.excluded_from_budget;

  // Determine budget type
  const budgetType = getTransactionBudgetType(txn.category, txn.budget_type);
  const isNeed = budgetType === "need";

  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    hapticFeedback('light');
    onClick(txn);
  }, [onClick, txn]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: Math.min(index * 0.03, 0.3),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: isExcluded ? 0 : -1,
      }}
      whileTap={{ scale: isExcluded ? 0.995 : 0.98 }}
      onClick={handleClick}
      className={`group w-full flex items-center gap-2 rounded-lg px-3 py-2 border border-border text-left cursor-pointer relative overflow-hidden bg-card transition-colors ${isExcluded
        ? "border-dashed opacity-40"
        : "hover:bg-accent/50"
        }`}
    >
      {/* Category Icon */}
      {CategoryIcon && (
        <div
          className={`shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center relative ${isExcluded ? "opacity-60" : ""
            }`}
        >
          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
          {/* Need indicator - small icon badge */}
          {isNeed && !isExcluded && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center bg-muted border border-border"
            >
              <CheckCheck className="h-2 w-2 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Main content - Category as primary, Merchant as subtitle */}
      <div className="min-w-0 flex-1 relative z-10">
        <p
          className={`font-semibold truncate text-xs flex items-center gap-1 ${isExcluded ? "text-muted-foreground/70" : "text-foreground"
            }`}
        >
          {txn.category || "Uncategorized"}
          {txn.details && (
            <span
              className="hover:opacity-80 shrink-0 transition-opacity text-muted-foreground"
              title={txn.details}
            >
              <Info className="h-3 w-3" />
            </span>
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <span
              className="shrink-0 text-muted-foreground"
              title={`Over ${txn.prorate_months} months`}
            >
              <CalendarRange className="h-3 w-3" />
            </span>
          )}
        </p>
        <p
          className={`text-[10px] truncate ${isExcluded ? "text-muted-foreground/50" : "text-muted-foreground"
            }`}
        >
          {txn.merchant || "Unknown"} • {formatDate(txn.date)}
          {txn.time && ` • ${formatTime(txn.time)}`}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`font-mono text-xs font-semibold shrink-0 text-right relative z-10 ${isExcluded
          ? "text-muted-foreground/50"
          : "text-foreground"
          }`}
      >
        -{formatCurrencyCompact(getMonthlyAmount(txn))}
      </span>

      {/* Chevron */}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-transform relative z-10 text-muted-foreground ${isExcluded ? "" : "group-hover:translate-x-0.5"
          }`}
      />
    </motion.button>
  );
});
