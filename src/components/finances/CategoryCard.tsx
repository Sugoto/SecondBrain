import { memo } from "react";
import type { Transaction } from "@/lib/supabase";
import {
  ChevronRight,
  Receipt,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatCurrency, CATEGORY_PASTEL_COLORS } from "./constants";
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
  const categoryName = name.replace(" (Needs)", "").replace(" (Wants)", "");
  const categoryPastelColor = CATEGORY_PASTEL_COLORS[categoryName] || "bg-pastel-blue";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="bg-card border-2 border-black dark:border-white rounded-xl overflow-hidden shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-pastel-yellow/30"
      >
        <motion.div
          animate={{ scale: isExpanded ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className={`h-9 w-9 rounded-lg ${categoryPastelColor} border-2 border-black dark:border-white flex items-center justify-center`}
        >
          <IconComp className="h-4 w-4 text-black dark:text-white" />
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground font-medium">
            {count} transaction{count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono text-sm font-bold text-foreground">
          {formatCurrency(total)}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-7 w-7 rounded-md bg-white dark:bg-white/10 border-2 border-black dark:border-white flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4 text-black dark:text-white" />
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
            <div className="border-t-2 border-black/10 dark:border-white/10 divide-y-2 divide-black/5 dark:divide-white/5">
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
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pastel-pink/30 text-left ${isExcluded
                      ? "opacity-40"
                      : ""
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold truncate flex items-center gap-1.5 ${isExcluded ? "text-muted-foreground" : "text-foreground"
                          }`}
                      >
                        {txn.merchant || "Unknown"}
                        {isProrated && (
                          <span
                            className="shrink-0 text-muted-foreground"
                            title={`${formatCurrency(txn.amount)} over ${txn.prorate_months} months`}
                          >
                            <CalendarRange className="h-3 w-3" />
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs font-medium ${isExcluded
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
                      className={`font-mono text-sm font-bold ${isExcluded
                        ? "text-muted-foreground/50"
                        : "text-foreground"
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
