import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryColor,
} from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { CategoryTotal, CategoryTotalsByBudgetType } from "./utils";
import { useTheme } from "@/hooks/useTheme";
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

  // Pie chart data for Needs
  const needsPieData = useMemo(() => {
    const data = EXPENSE_CATEGORIES.filter(
      (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0
    ).map((cat) => ({
      name: cat.name,
      value: categoryTotalsByBudgetType.needs[cat.name].total,
      color: getCategoryColor(cat.name),
    }));

    if (categoryTotalsByBudgetType.needs["Uncategorized"]?.count > 0) {
      data.push({
        name: "Other",
        value: categoryTotalsByBudgetType.needs["Uncategorized"].total,
        color: "#94a3b8",
      });
    }

    return data;
  }, [categoryTotalsByBudgetType]);

  // Pie chart data for Wants
  const wantsPieData = useMemo(() => {
    const data = EXPENSE_CATEGORIES.filter(
      (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0
    ).map((cat) => ({
      name: cat.name,
      value: categoryTotalsByBudgetType.wants[cat.name].total,
      color: getCategoryColor(cat.name),
    }));

    if (categoryTotalsByBudgetType.wants["Uncategorized"]?.count > 0) {
      data.push({
        name: "Other",
        value: categoryTotalsByBudgetType.wants["Uncategorized"].total,
        color: "#94a3b8",
      });
    }

    return data;
  }, [categoryTotalsByBudgetType]);

  const hasCategories =
    EXPENSE_CATEGORIES.some((cat) => categoryTotals[cat.name]?.count > 0) ||
    categoryTotals["Uncategorized"]?.count > 0;

  if (!hasCategories) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-5 pt-3 space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 text-center rounded-lg border-[1.5px] border-dashed border-black/30 dark:border-white/30 bg-card">
            <p className="text-xs font-medium text-muted-foreground">
              No transactions for this period
            </p>
          </div>
        </motion.div>
        <Footer />
      </div>
    );
  }

  const needsCategories = EXPENSE_CATEGORIES.filter(
    (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0
  ).sort(
    (a, b) =>
      (categoryTotalsByBudgetType.needs[b.name]?.total ?? 0) -
      (categoryTotalsByBudgetType.needs[a.name]?.total ?? 0)
  );

  const wantsCategories = EXPENSE_CATEGORIES.filter(
    (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0
  ).sort(
    (a, b) =>
      (categoryTotalsByBudgetType.wants[b.name]?.total ?? 0) -
      (categoryTotalsByBudgetType.wants[a.name]?.total ?? 0)
  );

  const hasNeedsUncategorized = categoryTotalsByBudgetType.needs["Uncategorized"]?.count > 0;
  const hasWantsUncategorized = categoryTotalsByBudgetType.wants["Uncategorized"]?.count > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-5 pt-3 space-y-3">
      {/* === NEEDS SECTION === */}
      {(needsPieData.length > 0 || needsCategories.length > 0 || hasNeedsUncategorized) && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-0.5">
            Needs
          </h3>

          {/* Needs Pie Chart */}
          {needsPieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-3 rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
                <div className="h-40 flex items-center justify-center">
                  <LabeledPieChart
                    data={needsPieData}
                    theme={theme}
                    formatValue={formatCurrency}
                    size={160}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Needs Category Cards */}
          {needsCategories.map((cat, index) => {
            const data = categoryTotalsByBudgetType.needs[cat.name];
            return (
              <CategoryCard
                key={`need-${cat.name}`}
                name={cat.name}
                icon={cat.icon}
                total={data.total}
                count={data.count}
                transactions={data.transactions}
                isExpanded={expandedCategory === `need-${cat.name}`}
                onToggle={() =>
                  onToggleCategory(
                    expandedCategory === `need-${cat.name}` ? null : `need-${cat.name}`
                  )
                }
                onTransactionClick={onTransactionClick}
                index={index}
              />
            );
          })}

          {/* Uncategorized Needs */}
          {hasNeedsUncategorized && (
            <CategoryCard
              name="Uncategorized (Needs)"
              icon={null}
              total={categoryTotalsByBudgetType.needs["Uncategorized"].total}
              count={categoryTotalsByBudgetType.needs["Uncategorized"].count}
              transactions={categoryTotalsByBudgetType.needs["Uncategorized"].transactions}
              isExpanded={expandedCategory === "need-Uncategorized"}
              onToggle={() =>
                onToggleCategory(
                  expandedCategory === "need-Uncategorized" ? null : "need-Uncategorized"
                )
              }
              onTransactionClick={onTransactionClick}
              index={EXPENSE_CATEGORIES.length}
            />
          )}
        </div>
      )}

      {/* === WANTS SECTION === */}
      {(wantsPieData.length > 0 || wantsCategories.length > 0 || hasWantsUncategorized) && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-0.5">
            Wants
          </h3>

          {/* Wants Pie Chart */}
          {wantsPieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-3 rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
                <div className="h-40 flex items-center justify-center">
                  <LabeledPieChart
                    data={wantsPieData}
                    theme={theme}
                    formatValue={formatCurrency}
                    size={160}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Wants Category Cards */}
          {wantsCategories.map((cat, index) => {
            const data = categoryTotalsByBudgetType.wants[cat.name];
            return (
              <CategoryCard
                key={`want-${cat.name}`}
                name={cat.name}
                icon={cat.icon}
                total={data.total}
                count={data.count}
                transactions={data.transactions}
                isExpanded={expandedCategory === `want-${cat.name}`}
                onToggle={() =>
                  onToggleCategory(
                    expandedCategory === `want-${cat.name}` ? null : `want-${cat.name}`
                  )
                }
                onTransactionClick={onTransactionClick}
                index={index}
              />
            );
          })}

          {/* Uncategorized Wants */}
          {hasWantsUncategorized && (
            <CategoryCard
              name="Uncategorized (Wants)"
              icon={null}
              total={categoryTotalsByBudgetType.wants["Uncategorized"].total}
              count={categoryTotalsByBudgetType.wants["Uncategorized"].count}
              transactions={categoryTotalsByBudgetType.wants["Uncategorized"].transactions}
              isExpanded={expandedCategory === "want-Uncategorized"}
              onToggle={() =>
                onToggleCategory(
                  expandedCategory === "want-Uncategorized" ? null : "want-Uncategorized"
                )
              }
              onTransactionClick={onTransactionClick}
              index={EXPENSE_CATEGORIES.length + 1}
            />
          )}
        </div>
      )}

      <Footer />
    </div>
  );
});
