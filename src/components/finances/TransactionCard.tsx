import { memo, useCallback } from "react";
import type { Transaction } from "@/lib/supabase";
import { Info, CalendarRange } from "lucide-react";
import { getMonthlyAmount } from "./utils";
import { hapticFeedback } from "@/hooks/useHaptics";
import { VALUE_RATING_LABELS } from "./constants";
import { useFormatCurrencyCompact } from "@/hooks/usePrivacy";

const RATING_STEPS = [1, 2, 3, 4, 5];

/** Five ticks filled to the rating. One hue, ordinal by count, so a high
 *  rating reads as "more" rather than as a green light. */
function ValueTicks({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      className="inline-flex items-center gap-[3px]"
      aria-label={`Worth it: ${VALUE_RATING_LABELS[rating] ?? rating} (${rating} of 5)`}
    >
      {RATING_STEPS.map((step) => (
        <span
          key={step}
          className={`h-[3px] w-[6px] rounded-full ${
            step <= rating ? "bg-[var(--ui-accent)]" : "bg-[var(--ui-edge)]"
          }`}
        />
      ))}
    </span>
  );
}

interface TransactionCardProps {
  transaction: Transaction;
  onClick: (transaction: Transaction) => void;
  index?: number;
  /** Last row of its day card: closes the card instead of ruling into the next row. */
  isLastOfDay?: boolean;
}

export const TransactionCard = memo(function TransactionCard({
  transaction: txn,
  onClick,
  isLastOfDay = false,
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
      className={`ui-type h-full w-full border-x border-[var(--ui-edge)] bg-[var(--ui-panel)] px-4 text-left transition-colors hover:bg-[var(--ui-inset)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ui-accent)] active:bg-[var(--ui-inset)] ${
        isLastOfDay
          ? "rounded-b-[14px] border-b border-[var(--ui-edge)]"
          : "border-b border-[var(--ui-rule)]"
      }`}
    >
      <div className={`flex h-full items-center gap-3 ${isExcluded ? "opacity-45" : ""}`}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <p className="truncate text-[14px] text-[var(--ui-ink)]">
            {txn.merchant || "Unknown merchant"}
          </p>
          {txn.details && (
            <Info
              className="h-3.5 w-3.5 shrink-0 text-[var(--ui-ink-softer)]"
              strokeWidth={1.75}
              aria-label={txn.details}
            />
          )}
          {txn.prorate_months && txn.prorate_months > 1 && (
            <CalendarRange
              className="h-3.5 w-3.5 shrink-0 text-[var(--ui-ink-softer)]"
              strokeWidth={1.75}
              aria-label={`Spread over ${txn.prorate_months} months`}
            />
          )}
        </div>

        {txn.value_rating && (
          <span className="shrink-0">
            <ValueTicks rating={txn.value_rating} />
          </span>
        )}

        <span className="ui-num shrink-0 text-right text-[15px] text-[var(--ui-ink)]">
          <span className="text-[var(--ui-ink-softer)]">−</span>
          {fmt(getMonthlyAmount(txn))}
        </span>
      </div>
    </button>
  );
});
