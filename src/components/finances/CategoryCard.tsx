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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.03, 0.15),
        ease: [0.2, 0, 0, 1],
      }}
      className="bg-card border border-outline-variant rounded-xl overflow-hidden"
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
      >
        <div
          className={`h-8 w-8 rounded-full ${categoryPastelColor} flex items-center justify-center shrink-0`}
        >
          <IconComp className="h-3.5 w-3.5 text-foreground" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-body-m text-foreground truncate">{name}</p>
          <p className="text-label-s text-muted-foreground">
            {count} transaction{count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono text-label-m text-foreground">
          {formatCurrency(total)}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 700, damping: 32 }}
          className="shrink-0"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-outline-variant">
              {transactions.map((txn, i) => {
                const isExcluded = txn.excluded_from_budget;
                const isProrated = txn.prorate_months && txn.prorate_months > 1;
                const displayAmount = getMonthlyAmount(txn);

                return (
                  <motion.button
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    onClick={() => onTransactionClick(txn)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      isExcluded ? "opacity-50" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-body-s truncate flex items-center gap-1.5 ${
                          isExcluded ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {txn.merchant || "Unknown"}
                        {isProrated && (
                          <CalendarRange className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </p>
                      <p className="text-label-s text-muted-foreground">
                        {formatDate(txn.date)}
                        {isProrated && (
                          <span className="ml-1">
                            · {formatCurrency(displayAmount)}/mo
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-label-s ${
                        isExcluded ? "text-muted-foreground" : "text-foreground"
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
