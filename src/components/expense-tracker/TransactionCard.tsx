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

function CategoryBadge({ category }: { category: string }) {
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === category);
  const Icon = cat?.icon;
  const color = getCategoryColor(category);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textColor = isDark ? color : `color-mix(in srgb, ${color} 70%, black)`;
  const bgOpacity = isDark
    ? { start: "30", end: "20" }
    : { start: "25", end: "15" };

  return (
    <div
      className="relative text-[9px] px-1.5 py-0.5 h-4 shrink-0 rounded-md flex items-center gap-0.5 font-semibold overflow-hidden"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${color}${bgOpacity.start} 0%, ${color}${bgOpacity.end} 100%)`
          : `linear-gradient(135deg, ${color}20 0%, ${color}12 100%)`,
        color: textColor,
        boxShadow: isDark
          ? `0 1px 4px ${color}20, inset 0 1px 0 rgba(255,255,255,0.2)`
          : `0 1px 3px ${color}15, inset 0 1px 0 rgba(255,255,255,0.5)`,
        border: `1px solid ${color}${isDark ? "30" : "25"}`,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {/* Glass shine */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)",
        }}
      />
      {Icon && <Icon className="h-2.5 w-2.5 relative z-10" />}
      <span className="relative z-10">{category}</span>
    </div>
  );
}

export function TransactionCard({
  transaction: txn,
  onClick,
  index = 0,
}: TransactionCardProps) {
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
        y: -2,
        boxShadow:
          "0 8px 24px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group w-full flex items-center gap-1.5 bg-card rounded-xl px-3 py-2.5 border text-left cursor-pointer ${
        txn.excluded_from_budget
          ? "border-dashed border-muted-foreground/20 opacity-50 grayscale-[30%]"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate text-xs flex items-center gap-1">
          {txn.merchant || "Unknown"}
          {txn.details && (
            <span
              className="text-primary/70 hover:text-primary shrink-0 transition-colors"
              title={txn.details}
            >
              <Info className="h-3 w-3" />
            </span>
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <span
              className="text-primary/70 shrink-0"
              title={`${formatCurrency(txn.amount)} over ${
                txn.prorate_months
              } months`}
            >
              <CalendarRange className="h-3 w-3" />
            </span>
          )}
        </p>
        <p className="text-muted-foreground text-[10px]">
          {formatDate(txn.date)}
          {txn.time && ` • ${formatTime(txn.time)}`}
        </p>
      </div>
      {txn.category && <CategoryBadge category={txn.category} />}
      <span
        className={`font-mono text-xs font-semibold shrink-0 w-12 text-right ${
          txn.type === "expense"
            ? getMonthlyAmount(txn) >= 500
              ? "text-red-500"
              : "text-foreground"
            : "text-income"
        }`}
      >
        {txn.type === "expense" ? "-" : "+"}
        {formatCurrencyCompact(getMonthlyAmount(txn))}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
}
