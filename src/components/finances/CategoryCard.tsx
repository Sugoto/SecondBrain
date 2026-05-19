import { memo } from "react";
import type { Transaction } from "@/lib/supabase";
import {
  ChevronDown,
  Receipt,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDate } from "./constants";
import { useFormatCurrency } from "@/hooks/usePrivacy";
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

// million-ignore - parent divide-y requires direct DOM child; Million block wrapping breaks it
export const CategoryCard = memo(function CategoryCard({
  name,
  icon,
  total,
  count,
  transactions,
  isExpanded,
  onToggle,
  onTransactionClick,
}: CategoryCardProps) {
  const IconComp = icon || Receipt;
  const fmt = useFormatCurrency();

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 text-left"
      >
        <IconComp
          className="h-4 w-4 text-muted-foreground shrink-0"
          strokeWidth={1.5}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground truncate">{name}</p>
          <p className="text-[10px] text-muted-foreground/80">
            {count} transaction{count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono tabular-nums text-[14px] text-foreground shrink-0">
          {fmt(total)}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground/70 shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-7 pb-2">
              {transactions.map((txn) => {
                const isExcluded = txn.excluded_from_budget;
                const isProrated = txn.prorate_months && txn.prorate_months > 1;
                const displayAmount = getMonthlyAmount(txn);

                return (
                  <button
                    key={txn.id}
                    onClick={() => onTransactionClick(txn)}
                    className={`w-full flex items-center gap-3 py-2 text-left border-b border-outline-variant/40 last:border-b-0 ${
                      isExcluded ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground truncate flex items-center gap-1.5">
                        {txn.merchant || "Unknown"}
                        {isProrated && (
                          <CalendarRange
                            className="h-3 w-3 shrink-0 text-muted-foreground/60"
                            strokeWidth={1.5}
                          />
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatDate(txn.date)}
                        {isProrated && (
                          <span> · {fmt(displayAmount)}/mo</span>
                        )}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-[12px] text-foreground">
                      −{fmt(displayAmount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
