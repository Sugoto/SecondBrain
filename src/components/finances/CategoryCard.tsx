import { memo } from "react";
import type { Transaction } from "@/lib/supabase";
import {
  ChevronRight,
  Receipt,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatDate,
  formatCurrency,
  getCategoryStyle,
  getCategoryColor,
} from "./constants";
import { getMonthlyAmount } from "./utils";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon | null;
  total: number;
  count: number;
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
  onTransactionClick: (txn: Transaction) => void;
  index?: number;
}

export const CategoryCard = memo(function CategoryCard({
  name,
  icon,
  total,
  count,
  transactions,
  isExpanded,
  onToggle,
  onTransactionClick,
  index = 0,
}: CategoryCardProps) {
  const IconComp = icon || Receipt;
  const isUncategorized = name === "Uncategorized";
  const categoryColor = getCategoryColor(name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="bg-card border rounded-lg overflow-hidden"
      style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-2.5 p-2.5 transition-colors hover:bg-accent/50"
      >
        <motion.div
          animate={{ scale: isExpanded ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className={`h-8 w-8 rounded-lg flex items-center justify-center relative overflow-hidden ${
            isUncategorized ? "bg-muted" : getCategoryStyle(name)
          }`}
          style={{
            boxShadow: isUncategorized
              ? "none"
              : "0 2px 6px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <IconComp
            className={`h-4 w-4 relative z-10 ${
              isUncategorized ? "text-muted-foreground" : ""
            }`}
          />
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          <p className="text-[10px] text-muted-foreground">
            {count} transaction{count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatCurrency(total)}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/10 divide-y divide-border/10">
              {transactions.map((txn, i) => {
                const isExcluded = txn.excluded_from_budget;
                const isProrated = txn.prorate_months && txn.prorate_months > 1;
                const displayAmount = getMonthlyAmount(txn);

                return (
                  <motion.button
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    whileTap={{ backgroundColor: "var(--accent)" }}
                    onClick={() => onTransactionClick(txn)}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 text-left ${
                      isExcluded
                        ? "opacity-40 grayscale-[60%] saturate-50"
                        : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate flex items-center gap-1 ${
                          isExcluded ? "text-muted-foreground/70" : ""
                        }`}
                      >
                        {txn.merchant || "Unknown"}
                        {isProrated && (
                          <span
                            className="shrink-0"
                            title={`${formatCurrency(txn.amount)} over ${
                              txn.prorate_months
                            } months`}
                            style={{
                              color: isExcluded ? undefined : categoryColor,
                            }}
                          >
                            <CalendarRange className="h-3 w-3" />
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-[10px] ${
                          isExcluded
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(txn.date)}
                        {isProrated && (
                          <span className="ml-1">
                            • {formatCurrency(displayAmount)}/mo
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isExcluded
                          ? "text-muted-foreground/50"
                          : displayAmount >= 500
                          ? "text-red-500"
                          : "text-expense"
                      }`}
                    >
                      -{formatCurrency(displayAmount)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
