import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { VALUE_RATING_KEYS } from "./utils";
import { VALUE_RATING_LABELS } from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { GroupTotal } from "./utils";
import { useTheme } from "@/hooks/useTheme";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { LabeledPieChart } from "@/components/shared";

interface TrendsViewProps {
  valueRatingTotals: Record<string, GroupTotal>;
  expandedGroup: string | null;
  onToggleGroup: (key: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

function groupLabel(key: string): string {
  if (key === "Unrated") return "Unrated";
  return `${key} · ${VALUE_RATING_LABELS[Number(key)]}`;
}

export const TrendsView = memo(function TrendsView({
  valueRatingTotals,
  expandedGroup,
  onToggleGroup,
  onTransactionClick,
}: TrendsViewProps) {
  const { theme } = useTheme();
  const formatCurrency = useFormatCurrency();

  const groups = useMemo(
    () => VALUE_RATING_KEYS.filter((key) => valueRatingTotals[key]?.count > 0),
    [valueRatingTotals],
  );

  const pieData = useMemo(
    () =>
      groups.map((key) => ({
        name: groupLabel(key),
        value: valueRatingTotals[key].total,
        color: undefined,
      })),
    [groups, valueRatingTotals],
  );

  if (groups.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="py-16 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            No transactions
          </p>
          <p className="text-[13px] text-muted-foreground/70">
            Nothing recorded for this period yet.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <section className="px-6 pt-7 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-foreground mb-4">
          By value
        </p>

        {pieData.length > 0 && (
          <div className="h-44 flex items-center justify-center mb-4">
            <LabeledPieChart
              data={pieData}
              theme={theme}
              formatValue={formatCurrency}
              size={170}
            />
          </div>
        )}

        <div className="divide-y divide-zinc-300 dark:divide-zinc-700">
          {groups.map((key, index) => {
            const data = valueRatingTotals[key];
            return (
              <CategoryCard
                key={key}
                name={groupLabel(key)}
                icon={null}
                total={data.total}
                count={data.count}
                transactions={data.transactions}
                isExpanded={expandedGroup === key}
                onToggle={() =>
                  onToggleGroup(expandedGroup === key ? null : key)
                }
                onTransactionClick={onTransactionClick}
                index={index}
              />
            );
          })}
        </div>
      </section>
      <div className="px-6 pt-6">
        <Footer />
      </div>
    </div>
  );
});
