import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { ChevronRight, Info, CalendarRange, CheckCheck } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { hapticFeedback } from "@/hooks/useHaptics";
import {
  formatDate,
  formatTime,
  formatCurrency,
  formatCurrencyCompact,
  getCategoryColor,
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === txn.category);
  const CategoryIcon = cat?.icon;

  const isExcluded = txn.excluded_from_budget;
  
  // Determine budget type
  const budgetType = getTransactionBudgetType(txn.category, txn.budget_type);
  const isNeed = budgetType === "need";
  
  // Always use category color (colorful for both needs and wants)
  const displayColor = getCategoryColor(txn.category ?? "");
  
  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    hapticFeedback('light');
    onClick(txn);
  }, [onClick, txn]);

  // Card background styling (neutral, subtle border)
  const cardStyle = {
    background: "transparent",
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(0, 0, 0, 0.04)",
  };

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
      style={cardStyle}
      className={`group w-full flex items-center gap-2 rounded-xl px-3 py-2 border text-left cursor-pointer relative overflow-hidden ${
        isExcluded
          ? "border-dashed border-muted/30 opacity-40 grayscale-[60%] saturate-50"
          : "hover:border-primary/30"
      }`}
    >
      {/* Category Icon */}
      {CategoryIcon && (
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative ${
            isExcluded ? "opacity-60" : ""
          }`}
          style={
            isExcluded
              ? {
                  background: isDark
                    ? "hsl(var(--muted))"
                    : "hsl(var(--muted)/0.8)",
                }
              : {
                  background: isDark
                    ? `linear-gradient(135deg, ${displayColor}30 0%, ${displayColor}18 100%)`
                    : `linear-gradient(135deg, ${displayColor}25 0%, ${displayColor}15 100%)`,
                  boxShadow: `0 2px 8px ${displayColor}20`,
                }
          }
        >
          <CategoryIcon
            className="h-4 w-4"
            style={{
              color: isExcluded
                ? "hsl(var(--muted-foreground))"
                : isDark
                ? displayColor
                : `color-mix(in srgb, ${displayColor} 80%, black)`,
            }}
          />
          {/* Need indicator - small icon badge */}
          {isNeed && !isExcluded && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
              style={{
                background: isDark ? "#1e293b" : "#f1f5f9",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              <CheckCheck
                className="h-2 w-2"
                style={{ color: "#64748b" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main content - Category as primary, Merchant as subtitle */}
      <div className="min-w-0 flex-1 relative z-10">
        <p
          className={`font-semibold truncate text-xs flex items-center gap-1 ${
            isExcluded ? "text-muted-foreground/70" : ""
          }`}
          style={
            isExcluded
              ? undefined
              : {
                  color: isDark
                    ? displayColor
                    : `color-mix(in srgb, ${displayColor} 75%, black)`,
                }
          }
        >
          {txn.category || "Uncategorized"}
          {txn.details && (
            <span
              className="hover:opacity-80 shrink-0 transition-opacity"
              title={txn.details}
              style={{ color: isExcluded ? undefined : displayColor }}
            >
              <Info className="h-3 w-3" />
            </span>
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <span
              className="shrink-0"
              title={`${formatCurrency(txn.amount)} over ${
                txn.prorate_months
              } months`}
              style={{ color: isExcluded ? undefined : displayColor }}
            >
              <CalendarRange className="h-3 w-3" />
            </span>
          )}
        </p>
        <p
          className={`text-[10px] truncate ${
            isExcluded ? "text-muted-foreground/50" : "text-muted-foreground"
          }`}
        >
          {txn.merchant || "Unknown"} • {formatDate(txn.date)}
          {txn.time && ` • ${formatTime(txn.time)}`}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`font-mono text-xs font-semibold shrink-0 text-right relative z-10 ${
          isExcluded
            ? "text-muted-foreground/50"
            : txn.type === "expense"
            ? getMonthlyAmount(txn) >= 500
              ? "text-red-500"
              : "text-foreground"
            : "text-income"
        }`}
      >
        {txn.type === "expense" ? "-" : "+"}
        {formatCurrencyCompact(getMonthlyAmount(txn))}
      </span>

      {/* Chevron */}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-transform relative z-10 ${
          isExcluded ? "" : "group-hover:translate-x-0.5"
        }`}
        style={{
          color: isExcluded
            ? "hsl(var(--muted-foreground)/0.3)"
            : isDark
            ? `${displayColor}60`
            : `${displayColor}50`,
        }}
      />
    </motion.button>
  );
});
