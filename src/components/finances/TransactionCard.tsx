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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.15,
        delay: Math.min(index * 0.02, 0.2),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileTap={{ scale: isExcluded ? 0.995 : 0.98 }}
      onClick={handleClick}
      className={`group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 border-[1.5px] text-left cursor-pointer relative overflow-hidden transition-all ${isExcluded
        ? "border-dashed border-black/30 dark:border-white/30 opacity-50 bg-muted"
        : "border-black dark:border-white bg-card shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0]"
        }`}
    >
      {/* Category Icon */}
      {CategoryIcon && (
        <div
          className={`shrink-0 w-7 h-7 rounded-md ${categoryPastelColor} border-[1.5px] border-black dark:border-white flex items-center justify-center relative ${isExcluded ? "opacity-60 border-dashed" : ""
            }`}
        >
          <CategoryIcon className="h-3.5 w-3.5 text-black dark:text-white" />
          {/* Need indicator - small icon badge */}
          {isNeed && !isExcluded && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center bg-pastel-green border-[1.5px] border-black dark:border-white"
            >
              <CheckCheck className="h-1.5 w-1.5 text-black dark:text-white" />
            </div>
          )}
        </div>
      )}

      {/* Main content - Category as primary, Merchant as subtitle */}
      <div className="min-w-0 flex-1 relative z-10">
        <p
          className={`font-bold truncate text-xs flex items-center gap-1 ${isExcluded ? "text-muted-foreground" : "text-foreground"
            }`}
        >
          {txn.category || "Uncategorized"}
          {txn.details && (
            <span
              className="hover:opacity-80 shrink-0 transition-opacity text-muted-foreground"
              title={txn.details}
            >
              <Info className="h-2.5 w-2.5" />
            </span>
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <span
              className="shrink-0 text-muted-foreground"
              title={`Over ${txn.prorate_months} months`}
            >
              <CalendarRange className="h-2.5 w-2.5" />
            </span>
          )}
        </p>
        <p
          className={`text-[9px] truncate font-medium ${isExcluded ? "text-muted-foreground/50" : "text-muted-foreground"
            }`}
        >
          {txn.merchant || "Unknown"} • {formatDate(txn.date)}
          {txn.time && ` • ${formatTime(txn.time)}`}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`font-mono text-xs font-bold shrink-0 text-right relative z-10 ${isExcluded
          ? "text-muted-foreground/50"
          : "text-foreground"
          }`}
      >
        -{formatCurrencyCompact(getMonthlyAmount(txn))}
      </span>

      {/* Chevron */}
      <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center relative z-10 ${isExcluded 
        ? "bg-muted" 
        : "bg-white dark:bg-white/10 border-[1.5px] border-black dark:border-white"}`}>
        <ChevronRight
          className={`h-3 w-3 transition-transform text-black dark:text-white ${isExcluded ? "opacity-50" : "group-hover:translate-x-0.5"
            }`}
        />
      </div>
    </motion.button>
  );
});
