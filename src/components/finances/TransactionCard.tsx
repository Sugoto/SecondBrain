import type { Transaction } from "@/lib/supabase";
import { ChevronRight, Info, CalendarRange } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import {
  formatDate,
  formatTime,
  formatCurrency,
  formatCurrencyCompact,
  getCategoryColor,
  EXPENSE_CATEGORIES,
} from "./constants";

interface TransactionCardProps {
  transaction: Transaction;
  onClick: () => void;
  index?: number;
}

export function TransactionCard({
  transaction: txn,
  onClick,
  index = 0,
}: TransactionCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const categoryColor = getCategoryColor(txn.category ?? "");
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === txn.category);
  const CategoryIcon = cat?.icon;

  const isExcluded = txn.excluded_from_budget;

  // Card background styling based on category (muted for excluded)
  const cardStyle = isExcluded
    ? {
        background: isDark
          ? "linear-gradient(135deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.15) 100%)"
          : "linear-gradient(135deg, hsl(var(--muted)/0.5) 0%, hsl(var(--muted)/0.25) 100%)",
        borderColor: isDark ? "hsl(var(--muted-foreground)/0.2)" : "hsl(var(--muted-foreground)/0.15)",
      }
    : {
        background: isDark
          ? `linear-gradient(135deg, ${categoryColor}12 0%, ${categoryColor}06 100%)`
          : `linear-gradient(135deg, ${categoryColor}10 0%, ${categoryColor}05 100%)`,
        borderColor: isDark ? `${categoryColor}25` : `${categoryColor}20`,
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
        y: isExcluded ? 0 : -2,
        boxShadow: isExcluded
          ? undefined
          : isDark
            ? `0 8px 24px -4px ${categoryColor}20, 0 0 0 1px ${categoryColor}30`
            : `0 8px 24px -4px ${categoryColor}15, 0 0 0 1px ${categoryColor}25`,
      }}
      whileTap={{ scale: isExcluded ? 0.995 : 0.98 }}
      onClick={onClick}
      style={cardStyle}
      className={`group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 border text-left cursor-pointer relative overflow-hidden ${
        isExcluded
          ? "border-dashed border-muted/30 opacity-40 grayscale-[60%] saturate-50"
          : "hover:border-primary/30"
      }`}
    >
      {/* Subtle glass shine effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${categoryColor}08 0%, transparent 40%)`
            : `linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%)`,
        }}
      />

      {/* Category Icon */}
      {CategoryIcon && (
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative ${isExcluded ? "opacity-60" : ""}`}
          style={
            isExcluded
              ? {
                  background: isDark
                    ? "hsl(var(--muted))"
                    : "hsl(var(--muted)/0.8)",
                }
              : {
                  background: isDark
                    ? `linear-gradient(135deg, ${categoryColor}30 0%, ${categoryColor}18 100%)`
                    : `linear-gradient(135deg, ${categoryColor}25 0%, ${categoryColor}15 100%)`,
                  boxShadow: `0 2px 8px ${categoryColor}20`,
                }
          }
        >
          <CategoryIcon
            className="h-4 w-4"
            style={{
              color: isExcluded
                ? "hsl(var(--muted-foreground))"
                : isDark
                  ? categoryColor
                  : `color-mix(in srgb, ${categoryColor} 80%, black)`,
            }}
          />
        </div>
      )}

      {/* Main content - Category as primary, Merchant as subtitle */}
      <div className="min-w-0 flex-1 relative z-10">
        <p
          className={`font-semibold truncate text-xs flex items-center gap-1 ${isExcluded ? "text-muted-foreground/70" : ""}`}
          style={
            isExcluded
              ? undefined
              : {
                  color: isDark
                    ? categoryColor
                    : `color-mix(in srgb, ${categoryColor} 75%, black)`,
                }
          }
        >
          {txn.category || "Uncategorized"}
          {txn.details && (
            <span
              className="hover:opacity-80 shrink-0 transition-opacity"
              title={txn.details}
              style={{ color: isExcluded ? undefined : categoryColor }}
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
              style={{ color: isExcluded ? undefined : categoryColor }}
            >
              <CalendarRange className="h-3 w-3" />
            </span>
          )}
        </p>
        <p className={`text-[10px] truncate ${isExcluded ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
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
        className={`h-3.5 w-3.5 shrink-0 transition-transform relative z-10 ${isExcluded ? "" : "group-hover:translate-x-0.5"}`}
        style={{
          color: isExcluded
            ? "hsl(var(--muted-foreground)/0.3)"
            : isDark
              ? `${categoryColor}60`
              : `${categoryColor}50`,
        }}
      />
    </motion.button>
  );
}

