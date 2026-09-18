import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { Footer } from "./Footer";
import { useFormatCurrency } from "@/hooks/usePrivacy";

interface TrendsViewProps {
  transactions: Transaction[];
}

export const TrendsView = memo(function TrendsView({ transactions }: TrendsViewProps) {
  const formatCurrency = useFormatCurrency();

  const cardTotals = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    const totals = new Map<string, number>();
    for (const txn of transactions) {
      if (!txn.card_number) continue;
      if (new Date(txn.date) < cutoff) continue;
      totals.set(txn.card_number, (totals.get(txn.card_number) ?? 0) + txn.amount);
    }
    return [...totals.entries()]
      .map(([card, total]) => ({ card, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  return (
    <div className="max-w-6xl mx-auto">
      {cardTotals.length > 0 ? (
        <div className="px-6 pt-7">
          <section className="ui-panel px-5 pt-5 pb-4">
            <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Spent by card</h2>
            <p className="text-[13px] text-[var(--ui-ink-softer)]">Last 3 months</p>
            <div className="mt-3 divide-y divide-[var(--ui-rule)]">
              {cardTotals.map(({ card, total }) => (
                <div key={card} className="flex items-center justify-between py-2.5">
                  <span className="text-[14px] text-[var(--ui-ink)]">{card}</span>
                  <span className="ui-num text-[15px] text-[var(--ui-ink)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="px-6 pt-7">
          <h2 className="text-[13px] font-medium text-[var(--ui-accent)] mb-2">Spent by card</h2>
          <p className="text-[13px] text-[var(--ui-ink-softer)]">
            No card spending in the last 3 months yet.
          </p>
        </section>
      )}

      <div className="px-6 pt-6">
        <Footer />
      </div>
    </div>
  );
});
