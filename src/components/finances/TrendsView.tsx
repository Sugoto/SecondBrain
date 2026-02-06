import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryColor,
} from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { CategoryTotal, CategoryTotalsByBudgetType } from "./utils";
import { getMonthlyAmount, isProratedInMonth } from "./utils";
import type { ChartMode } from "./types";
import { useTheme } from "@/hooks/useTheme";
import { LabeledPieChart } from "@/components/shared";

interface TrendsViewProps {
  transactions: Transaction[];
  chartMode: ChartMode;
  categoryTotals: Record<string, CategoryTotal>;
  categoryTotalsByBudgetType: CategoryTotalsByBudgetType;
  expandedCategory: string | null;
  onToggleCategory: (name: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

// ECharts Area Chart - Neo-brutalism style
const AreaChart = memo(function AreaChart({
  data,
  theme,
}: {
  data: { label: string; total: number }[];
  theme: "light" | "dark";
}) {
  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#FFFBF0" : "#1a1a1a";
    const borderColor = isDark ? "#FFFBF0" : "#1a1a1a";
    const gridColor = isDark ? "rgba(255, 251, 240, 0.2)" : "rgba(26, 26, 26, 0.15)";
    
    // Neo-brutalism pastel for the line and area
    const lineColor = isDark ? "#FFE5EC" : "#1a1a1a"; // Pink in dark, black in light
    const areaColorStart = isDark ? "rgba(255, 229, 236, 0.4)" : "rgba(212, 237, 218, 0.6)"; // Pink/Green pastel
    const areaColorEnd = isDark ? "rgba(255, 229, 236, 0)" : "rgba(212, 237, 218, 0)";

    // Format labels for x-axis (show only day part)
    const xLabels = data.map((d) => d.label.split(" ")[1] || d.label);
    const values = data.map((d) => d.total);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "#1a1a2e" : "#FDF6E3",
        borderColor: borderColor,
        borderWidth: 2,
        padding: [12, 16],
        textStyle: {
          color: textColor,
          fontSize: 12,
          fontWeight: 600,
        },
        extraCssText: `
          border-radius: 12px;
          box-shadow: 4px 4px 0 ${borderColor};
        `,
        axisPointer: {
          type: "line",
          lineStyle: {
            color: borderColor,
            width: 2,
            type: "solid",
          },
        },
        formatter: (params) => {
          const p = params as { dataIndex: number; value: number }[];
          if (!p.length) return "";
          const idx = p[0].dataIndex;
          const item = data[idx];
          return `<div style="font-weight:700;font-size:13px">${item.label}</div>
                  <div style="font-weight:600;margin-top:4px">₹${item.total.toLocaleString("en-IN")}</div>`;
        },
      },
      grid: {
        left: 50,
        right: 15,
        top: 15,
        bottom: 35,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: {
          lineStyle: { color: borderColor, width: 2 },
        },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          fontWeight: 600,
          interval: Math.ceil(data.length / 7) - 1,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: true,
          lineStyle: { color: borderColor, width: 2 },
        },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: gridColor,
            type: "solid",
            width: 1,
          },
        },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          fontWeight: 600,
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`,
        },
      },
      series: [
        {
          type: "line",
          data: values,
          smooth: false,
          symbol: "rect", // Square symbols for neo-brutalism
          symbolSize: 10,
          itemStyle: {
            color: isDark ? "#D4EDDA" : "#FFE5EC", // Pastel green/pink
            borderColor: borderColor,
            borderWidth: 2,
          },
          lineStyle: {
            width: 3,
            color: lineColor,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: areaColorStart },
                { offset: 1, color: areaColorEnd },
              ],
            },
          },
          emphasis: {
            scale: 1.5,
            itemStyle: {
              // Just increase border on hover, no shadow offset
              borderWidth: 3,
            },
          },
          animationDuration: 600,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [data, theme]);

  // Don't render if no data or insufficient data points
  if (!data || data.length < 2) return null;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "100%" }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
});

export const TrendsView = memo(function TrendsView({
  transactions,
  chartMode,
  categoryTotals,
  categoryTotalsByBudgetType,
  expandedCategory,
  onToggleCategory,
  onTransactionClick,
}: TrendsViewProps) {
  const { theme } = useTheme();

  // Daily spending data for the last 14 days
  const dailyData = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLabel = date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
      });

      const dayTotal = transactions
        .filter(
          (t) =>
            t.date === dateStr &&
            !t.excluded_from_budget
        )
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({ date: dateStr, label: dayLabel, total: dayTotal });
    }
    return days;
  }, [transactions]);

  // Monthly spending data for the last 6 months
  const monthlyData = useMemo(() => {
    const months: { month: string; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTotal = transactions
        .filter((t) => {
          if (t.excluded_from_budget) return false;

          if (t.prorate_months && t.prorate_months > 1) {
            return isProratedInMonth(t, monthStart);
          }

          const txnDate = new Date(t.date);
          return txnDate >= monthStart && txnDate <= monthEnd;
        })
        .reduce((sum, t) => sum + getMonthlyAmount(t), 0);

      const label = monthStart.toLocaleDateString("en-IN", { month: "short" });
      months.push({
        month: monthStart.toISOString().split("T")[0],
        label,
        total: monthTotal,
      });
    }
    return months;
  }, [transactions]);

  const chartData = chartMode === "daily" ? dailyData : monthlyData;

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

  const hasExpenses = useMemo(
    () => transactions.length > 0,
    [transactions]
  );

  if (!hasCategories && !hasExpenses) {
    return (
      <div className="max-w-6xl mx-auto p-5 md:p-6 pt-4 space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8 text-center rounded-xl border-2 border-dashed border-black/30 dark:border-white/30 bg-card">
            <p className="text-sm font-medium text-muted-foreground">
              No transactions for this period
            </p>
          </div>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5 md:p-6 pt-4 space-y-5">
      {/* Spending Area Chart - Neo-brutalism */}
      {hasExpenses && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="p-4 overflow-hidden rounded-xl border-2 border-black dark:border-white bg-card shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]">
            <h3 className="text-sm font-bold mb-3 text-foreground">
              {chartMode === "daily" ? "Last 14 Days" : "Last 6 Months"}
            </h3>
            <div className="h-48">
              <AreaChart data={chartData} theme={theme} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Pie Charts - Wants on top, Needs below, in same card */}
      {(needsPieData.length > 0 || wantsPieData.length > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="p-4 space-y-4 rounded-xl border-2 border-black dark:border-white bg-card shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]">
            {/* Needs Pie Chart */}
            <div>
              <h3 className="text-xs font-bold text-center mb-1 text-muted-foreground uppercase tracking-wide">
                Needs
              </h3>
              <div className="h-48 flex items-center justify-center">
                {needsPieData.length > 0 ? (
                  <LabeledPieChart
                    data={needsPieData}
                    theme={theme}
                    formatValue={formatCurrency}
                    size={180}
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            <div className="border-t-2 border-black/10 dark:border-white/10" />

            {/* Wants Pie Chart */}
            <div>
              <h3 className="text-xs font-bold text-center mb-1 text-muted-foreground uppercase tracking-wide">
                Wants
              </h3>
              <div className="h-48 flex items-center justify-center">
                {wantsPieData.length > 0 ? (
                  <LabeledPieChart
                    data={wantsPieData}
                    theme={theme}
                    formatValue={formatCurrency}
                    size={180}
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Needs Categories - uses actual budget type from transactions */}
      {EXPENSE_CATEGORIES.filter(
        (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0
      ).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
              Needs
            </h3>
            {EXPENSE_CATEGORIES.filter(
              (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0
            )
              .sort(
                (a, b) =>
                  (categoryTotalsByBudgetType.needs[b.name]?.total ?? 0) -
                  (categoryTotalsByBudgetType.needs[a.name]?.total ?? 0)
              )
              .map((cat, index) => {
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
          </div>
        )}

      {/* Wants Categories - uses actual budget type from transactions */}
      {EXPENSE_CATEGORIES.filter(
        (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0
      ).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
              Wants
            </h3>
            {EXPENSE_CATEGORIES.filter(
              (cat) => categoryTotalsByBudgetType.wants[cat.name]?.count > 0
            )
              .sort(
                (a, b) =>
                  (categoryTotalsByBudgetType.wants[b.name]?.total ?? 0) -
                  (categoryTotalsByBudgetType.wants[a.name]?.total ?? 0)
              )
              .map((cat, index) => {
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
          </div>
        )}

      {/* Uncategorized - Needs */}
      {categoryTotalsByBudgetType.needs["Uncategorized"]?.count > 0 && (
        <div className="space-y-3">
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
        </div>
      )}

      {/* Uncategorized - Wants */}
      {categoryTotalsByBudgetType.wants["Uncategorized"]?.count > 0 && (
        <div className="space-y-3">
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
        </div>
      )}

      <Footer />
    </div>
  );
});
