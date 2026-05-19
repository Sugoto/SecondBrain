import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { Info, CalendarRange } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { hapticFeedback } from "@/hooks/useHaptics";
import {
  formatDate,
  EXPENSE_CATEGORIES,
  getTransactionBudgetType,
} from "./constants";
import { useFormatCurrencyCompact } from "@/hooks/usePrivacy";

interface TransactionCardProps {
  transaction: Transaction;
  onClick: (transaction: Transaction) => void;
  index?: number;
}

export const TransactionCard = memo(function TransactionCard({
  transaction: txn,
  onClick,
}: TransactionCardProps) {
  const fmt = useFormatCurrencyCompact();
  const cat = EXPENSE_CATEGORIES.find((c) => c.name === txn.category);
  const CategoryIcon = cat?.icon;

  const isExcluded = txn.excluded_from_budget;
  const isNeed = getTransactionBudgetType(txn.category, txn.budget_type) === "need";

  const handleClick = useCallback(() => {
    hapticFeedback("light");
    onClick(txn);
  }, [onClick, txn]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left border-b border-outline-variant/60 transition-colors active:bg-surface-container-low/50"
    >
      <div
        className={`flex items-center gap-3 py-3 ${
          isExcluded ? "opacity-40" : ""
        }`}
      >
        {CategoryIcon && (
          <div className="shrink-0 w-8 h-8 flex items-center justify-center text-muted-foreground">
            <CategoryIcon className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] text-foreground truncate">
              {txn.category || "Uncategorized"}
            </p>
            {isNeed && !isExcluded && (
              <span
                className="inline-block h-1 w-1 rounded-full bg-success shrink-0"
                aria-label="Need"
              />
            )}
            {txn.details && (
              <Info
                className="h-3 w-3 shrink-0 text-muted-foreground/60"
                strokeWidth={1.5}
                aria-label={txn.details}
              />
            )}
            {txn.prorate_months && txn.prorate_months > 1 && (
              <CalendarRange
                className="h-3 w-3 shrink-0 text-muted-foreground/60"
                strokeWidth={1.5}
                aria-label={`Over ${txn.prorate_months} months`}
              />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
            {txn.merchant || "Unknown merchant"}
            <span className="text-muted-foreground/50">
              {" · "}
              {formatDate(txn.date)}
            </span>
          </p>
        </div>

        <span className="font-mono tabular-nums text-[15px] shrink-0 text-right text-foreground">
          −{fmt(getMonthlyAmount(txn))}
        </span>
      </div>
    </button>
  );
});
