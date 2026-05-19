import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { EXPENSE_CATEGORIES } from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { CategoryTotal, CategoryTotalsByBudgetType } from "./utils";
import { useTheme } from "@/hooks/useTheme";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { LabeledPieChart } from "@/components/shared";

interface TrendsViewProps {
  categoryTotals: Record<string, CategoryTotal>;
  categoryTotalsByBudgetType: CategoryTotalsByBudgetType;
  expandedCategory: string | null;
  onToggleCategory: (name: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

export const TrendsView = memo(function TrendsView({
  categoryTotals,
  categoryTotalsByBudgetType,
  expandedCategory,
  onToggleCategory,
  onTransactionClick,
}: TrendsViewProps) {
  const { theme } = useTheme();
  const formatCurrency = useFormatCurrency();

  const needsPieData = useMemo(() => {
    const data = EXPENSE_CATEGORIES.filter(
      (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0,
    ).map((cat) => ({
      name: cat.name,
      value: categoryTotalsByBudgetType.needs[cat.name].total,
      color: undefined,
    }));
    if (categoryTotalsByBudgetType.needs["Uncategorized"]?.count > 0) {
      data.push({
        name: "Other",
        value: categoryTotalsByBudgetType.needs["Uncategorized"].total,
        color: undefined,
      });
    }
    return data.sort((a, b) => b.value - a.value);
  }, [categoryTotalsByBudgetType]);

  const wantsPieData = useMemo(() => {
    const data = EXPENSE_CATEGORIES.filter(
      (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0,
    ).map((cat) => ({
      name: cat.name,
      value: categoryTotalsByBudgetType.wants[cat.name].total,
      color: undefined,
    }));
    if (categoryTotalsByBudgetType.wants["Uncategorized"]?.count > 0) {
      data.push({
        name: "Other",
        value: categoryTotalsByBudgetType.wants["Uncategorized"].total,
        color: undefined,
      });
    }
    return data.sort((a, b) => b.value - a.value);
  }, [categoryTotalsByBudgetType]);

  const hasCategories =
    EXPENSE_CATEGORIES.some((cat) => categoryTotals[cat.name]?.count > 0) ||
    categoryTotals["Uncategorized"]?.count > 0;

  if (!hasCategories) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="py-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
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

  const needsCategories = EXPENSE_CATEGORIES.filter(
    (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0,
  ).sort(
    (a, b) =>
      (categoryTotalsByBudgetType.needs[b.name]?.total ?? 0) -
      (categoryTotalsByBudgetType.needs[a.name]?.total ?? 0),
  );

  const wantsCategories = EXPENSE_CATEGORIES.filter(
    (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0,
  ).sort(
    (a, b) =>
      (categoryTotalsByBudgetType.wants[b.name]?.total ?? 0) -
      (categoryTotalsByBudgetType.wants[a.name]?.total ?? 0),
  );

  const hasNeedsUncategorized =
    categoryTotalsByBudgetType.needs["Uncategorized"]?.count > 0;
  const hasWantsUncategorized =
    categoryTotalsByBudgetType.wants["Uncategorized"]?.count > 0;

  const renderSection = (
    label: string,
    pieData: { name: string; value: number; color?: string }[],
    categories: typeof EXPENSE_CATEGORIES,
    bucket: "needs" | "wants",
    hasUncategorized: boolean,
    isFirst: boolean,
  ) => (
    <section className={`px-6 pt-7 pb-2 ${isFirst ? "" : "border-t border-zinc-300 dark:border-zinc-700"}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-foreground mb-4">
        {label}
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
        {categories.map((cat, index) => {
          const data = categoryTotalsByBudgetType[bucket][cat.name];
          const key = `${bucket === "needs" ? "need" : "want"}-${cat.name}`;
          return (
            <CategoryCard
              key={key}
              name={cat.name}
              icon={cat.icon}
              total={data.total}
              count={data.count}
              transactions={data.transactions}
              isExpanded={expandedCategory === key}
              onToggle={() =>
                onToggleCategory(expandedCategory === key ? null : key)
              }
              onTransactionClick={onTransactionClick}
              index={index}
            />
          );
        })}

        {hasUncategorized && (
          <CategoryCard
            name={`Uncategorized (${label})`}
            icon={null}
            total={categoryTotalsByBudgetType[bucket]["Uncategorized"].total}
            count={categoryTotalsByBudgetType[bucket]["Uncategorized"].count}
            transactions={
              categoryTotalsByBudgetType[bucket]["Uncategorized"].transactions
            }
            isExpanded={
              expandedCategory === `${bucket === "needs" ? "need" : "want"}-Uncategorized`
            }
            onToggle={() =>
              onToggleCategory(
                expandedCategory ===
                  `${bucket === "needs" ? "need" : "want"}-Uncategorized`
                  ? null
                  : `${bucket === "needs" ? "need" : "want"}-Uncategorized`,
              )
            }
            onTransactionClick={onTransactionClick}
            index={EXPENSE_CATEGORIES.length}
          />
        )}
      </div>
    </section>
  );

  const showNeeds =
    needsPieData.length > 0 || needsCategories.length > 0 || hasNeedsUncategorized;
  const showWants =
    wantsPieData.length > 0 || wantsCategories.length > 0 || hasWantsUncategorized;

  return (
    <div className="max-w-6xl mx-auto">
      {showNeeds &&
        renderSection("Needs", needsPieData, needsCategories, "needs", hasNeedsUncategorized, true)}
      {showWants &&
        renderSection("Wants", wantsPieData, wantsCategories, "wants", hasWantsUncategorized, showNeeds)}
      <div className="px-6 pt-6">
        <Footer />
      </div>
    </div>
  );
});
