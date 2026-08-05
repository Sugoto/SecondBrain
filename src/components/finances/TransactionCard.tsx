import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { Info, CalendarRange } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { hapticFeedback } from "@/hooks/useHaptics";
import { formatDate, getValueRatingTint } from "./constants";
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

  const isExcluded = txn.excluded_from_budget;

  const handleClick = useCallback(() => {
    hapticFeedback("light");
    onClick(txn);
  }, [onClick, txn]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{ backgroundColor: getValueRatingTint(txn.value_rating) }}
      className="w-full text-left border-b border-outline-variant/60 transition-[filter,background-color] duration-300 active:brightness-95"
    >
      <div
        className={`flex items-center gap-3 py-3 ${
          isExcluded ? "opacity-40" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] text-foreground truncate">
              {txn.merchant || "Unknown merchant"}
            </p>
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
            {formatDate(txn.date)}
          </p>
        </div>

        <span className="font-mono tabular-nums text-[15px] shrink-0 text-right text-foreground">
          −{fmt(getMonthlyAmount(txn))}
        </span>
      </div>
    </button>
  );
});
