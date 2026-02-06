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
  CATEGORY_PASTEL_COLORS,
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
  const categoryPastelColor = CATEGORY_PASTEL_COLORS[txn.category ?? ""] || "bg-pastel-blue";

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
      whileTap={{ scale: isExcluded ? 0.995 : 0.98 }}
      onClick={handleClick}
      className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 text-left cursor-pointer relative overflow-hidden transition-all ${isExcluded
        ? "border-dashed border-black/30 dark:border-white/30 opacity-50 bg-muted"
        : "border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1a1a1a] dark:hover:shadow-[3px_3px_0_#FFFBF0]"
        }`}
    >
      {/* Category Icon */}
      {CategoryIcon && (
        <div
          className={`shrink-0 w-9 h-9 rounded-lg ${categoryPastelColor} border-2 border-black dark:border-white flex items-center justify-center relative ${isExcluded ? "opacity-60 border-dashed" : ""
            }`}
        >
          <CategoryIcon className="h-4 w-4 text-black dark:text-white" />
          {/* Need indicator - small icon badge */}
          {isNeed && !isExcluded && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-pastel-green border-2 border-black dark:border-white"
            >
              <CheckCheck className="h-2 w-2 text-black dark:text-white" />
            </div>
          )}
        </div>
      )}

      {/* Main content - Category as primary, Merchant as subtitle */}
      <div className="min-w-0 flex-1 relative z-10">
        <p
          className={`font-bold truncate text-sm flex items-center gap-1.5 ${isExcluded ? "text-muted-foreground" : "text-foreground"
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
          className={`text-[10px] truncate font-medium ${isExcluded ? "text-muted-foreground/50" : "text-muted-foreground"
            }`}
        >
          {txn.merchant || "Unknown"} • {formatDate(txn.date)}
          {txn.time && ` • ${formatTime(txn.time)}`}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`font-mono text-sm font-bold shrink-0 text-right relative z-10 ${isExcluded
          ? "text-muted-foreground/50"
          : "text-foreground"
          }`}
      >
        -{formatCurrencyCompact(getMonthlyAmount(txn))}
      </span>

      {/* Chevron */}
      <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center relative z-10 ${isExcluded 
        ? "bg-muted" 
        : "bg-white dark:bg-white/10 border-2 border-black dark:border-white"}`}>
        <ChevronRight
          className={`h-4 w-4 transition-transform text-black dark:text-white ${isExcluded ? "opacity-50" : "group-hover:translate-x-0.5"
            }`}
        />
      </div>
    </motion.button>
  );
});
