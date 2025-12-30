import { useMemo, memo } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
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
  chartCategoryTotals: Record<string, CategoryTotal>;
  expandedCategory: string | null;
  onToggleCategory: (name: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

// million-ignore - SVG elements not compatible with Million.js
// Pure SVG Area Chart - lightweight and works with any data format
const AreaChart = memo(function AreaChart({
  data,
  theme,
}: {
  data: { label: string; total: number }[];
  theme: "light" | "dark";
}) {
  const width = 320;
  const height = 180;
  const padding = { top: 0, right: 10, bottom: 30, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.total), 1);

  // Create points for the area
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.total / maxValue) * chartHeight;
    return { x, y, label: d.label, value: d.total };
  });

  // Create SVG path for the line
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Create area path (line + bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`;

  const isDark = theme === "dark";
  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const textColor = isDark ? "#a1a1aa" : "#71717a";

  // Y-axis ticks
  const yTicks = [0, maxValue * 0.5, maxValue];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* X-axis line */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke={gridColor}
        strokeWidth={1}
      />

      {/* Y-axis line */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke={gridColor}
        strokeWidth={1}
      />

      {/* Horizontal grid lines */}
      {yTicks.map((tick, i) => {
        const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={gridColor}
              strokeDasharray="3,3"
              strokeOpacity={0.6}
            />
            <text
              x={padding.left - 5}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill={textColor}
            >
              {tick >= 1000
                ? `₹${(tick / 1000).toFixed(0)}k`
                : `₹${Math.round(tick)}`}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGradient)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#8b5cf6"
          stroke={isDark ? "#18181b" : "#ffffff"}
          strokeWidth={2}
        >
          <title>{`${p.label}: ₹${p.value.toLocaleString()}`}</title>
        </circle>
      ))}

      {/* X-axis labels */}
      {points
        .filter(
          (_, i) =>
            i % Math.ceil(points.length / 7) === 0 || i === points.length - 1
        )
        .map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize={10}
            fill={textColor}
          >
            {p.label.split(" ")[1] || p.label}
          </text>
        ))}
    </svg>
  );
});

export const TrendsView = memo(function TrendsView({
  transactions,
  chartMode,
  categoryTotals,
  categoryTotalsByBudgetType,
  chartCategoryTotals,
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
            t.type === "expense" &&
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
          if (t.type !== "expense" || t.excluded_from_budget) return false;

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

  // Pie chart data
  const pieData = useMemo(() => {
    const data = EXPENSE_CATEGORIES.filter(
      (cat) => chartCategoryTotals[cat.name]?.count > 0
    ).map((cat) => ({
      name: cat.name,
      value: chartCategoryTotals[cat.name].total,
      color: getCategoryColor(cat.name),
    }));

    if (chartCategoryTotals["Uncategorized"]?.count > 0) {
      data.push({
        name: "Other",
        value: chartCategoryTotals["Uncategorized"].total,
        color: "#94a3b8",
      });
    }

    return data;
  }, [chartCategoryTotals]);

  const hasCategories =
    EXPENSE_CATEGORIES.some((cat) => categoryTotals[cat.name]?.count > 0) ||
    categoryTotals["Uncategorized"]?.count > 0;

  const hasExpenses = useMemo(
    () => transactions.some((t) => t.type === "expense"),
    [transactions]
  );

  if (!hasCategories && !hasExpenses) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No transactions for this period
            </p>
          </Card>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
      {/* Spending Area Chart - Pure SVG */}
      {hasExpenses && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="p-4 overflow-hidden">
            <h3 className="text-sm font-medium mb-3">
              {chartMode === "daily" ? "Last 14 Days" : "Last 6 Months"}
            </h3>
            <div className="h-48">
              <AreaChart data={chartData} theme={theme} />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pie Chart - Pure SVG with connecting lines */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-medium text-center mb-2">
              Spending by Category
            </h3>
            <div className="h-56 flex items-center justify-center">
              <LabeledPieChart
                data={pieData}
                theme={theme}
                formatValue={formatCurrency}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Needs Categories - uses actual budget type from transactions */}
      {EXPENSE_CATEGORIES.filter(
        (cat) => categoryTotalsByBudgetType.needs[cat.name]?.count > 0
      ).length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
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
        <div className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
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
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
