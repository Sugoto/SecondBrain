import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryColor,
} from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { CategoryTotal } from "./utils";
import { getMonthlyAmount, isProratedInMonth } from "./utils";
import type { ChartMode } from "./types";
import { useTheme } from "@/hooks/useTheme";

// Custom label renderer with connecting lines for pie chart
interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  color: string;
  theme: "light" | "dark";
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  color,
  theme,
}: LabelProps) {
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);

  // Start point on the arc edge
  const sx = cx + (outerRadius + 4) * cos;
  const sy = cy + (outerRadius + 4) * sin;

  // Elbow point
  const mx = cx + (outerRadius + 18) * cos;
  const my = cy + (outerRadius + 18) * sin;

  // End point (horizontal extension)
  const ex = mx + (cos >= 0 ? 1 : -1) * 16;
  const ey = my;

  // Text anchor based on which side
  const textAnchor = cos >= 0 ? "start" : "end";

  const textColor = theme === "dark" ? "#a1a1aa" : "#71717a";
  const percentage = (percent * 100).toFixed(0);

  return (
    <g>
      {/* Connecting line */}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeOpacity={0.6}
      />
      {/* Small circle at the end */}
      <circle cx={ex} cy={ey} r={2} fill={color} />
      {/* Label text */}
      <text
        x={ex + (cos >= 0 ? 4 : -4)}
        y={ey}
        textAnchor={textAnchor}
        fill={textColor}
        fontSize={9}
        fontWeight={500}
        dominantBaseline="central"
      >
        {name}
      </text>
      {/* Percentage below */}
      <text
        x={ex + (cos >= 0 ? 4 : -4)}
        y={ey + 10}
        textAnchor={textAnchor}
        fill={color}
        fontSize={8}
        fontWeight={600}
        dominantBaseline="central"
      >
        {percentage}%
      </text>
    </g>
  );
}

interface TrendsViewProps {
  transactions: Transaction[];
  chartMode: ChartMode;
  categoryTotals: Record<string, CategoryTotal>;
  chartCategoryTotals: Record<string, CategoryTotal>; // Excludes budget-excluded for pie chart
  expandedCategory: string | null;
  onToggleCategory: (name: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

export function TrendsView({
  transactions,
  chartMode,
  categoryTotals,
  chartCategoryTotals,
  expandedCategory,
  onToggleCategory,
  onTransactionClick,
}: TrendsViewProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Theme-aware colors for SVG elements (CSS variables don't work reliably in SVG)
  const chartColors = useMemo(
    () => ({
      text: theme === "dark" ? "#a1a1aa" : "#71717a",
      grid: theme === "dark" ? "#3f3f46" : "#e4e4e7",
      axis: theme === "dark" ? "#52525b" : "#d4d4d8",
      tooltip: {
        bg: theme === "dark" ? "#18181b" : "#ffffff",
        border: theme === "dark" ? "#3f3f46" : "#e4e4e7",
      },
    }),
    [theme]
  );

  // Daily spending data for the last 14 days (excludes budget-excluded transactions)
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

  // Monthly spending data for the last 6 months (excludes budget-excluded transactions)
  const monthlyData = useMemo(() => {
    const months: { month: string; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTotal = transactions
        .filter((t) => {
          if (t.type !== "expense" || t.excluded_from_budget) return false;

          // For prorated transactions, check if this month is in the proration window
          if (t.prorate_months && t.prorate_months > 1) {
            return isProratedInMonth(t, monthStart);
          }

          // Regular transactions - check if date falls in month
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

  const lineChartData = chartMode === "daily" ? dailyData : monthlyData;

  // Pie chart uses chartCategoryTotals which excludes budget-excluded transactions
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

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  // Check if there are any categories with transactions
  const hasCategories =
    EXPENSE_CATEGORIES.some((cat) => categoryTotals[cat.name]?.count > 0) ||
    categoryTotals["Uncategorized"]?.count > 0;

  // Check if we have any expense transactions at all
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
      {/* Spending Area Chart */}
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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lineChartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient
                      id="colorSpending"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop
                        offset="50%"
                        stopColor="#3b82f6"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartColors.grid}
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 11,
                      fill: chartColors.text,
                    }}
                    tickLine={{ stroke: chartColors.axis }}
                    axisLine={{ stroke: chartColors.axis }}
                    interval={chartMode === "daily" ? 2 : 0}
                    tickMargin={8}
                    tickFormatter={(label) => {
                      // Extract day number and add ordinal suffix for daily view
                      if (chartMode === "daily") {
                        const parts = label.split(" ");
                        const day = parseInt(parts[1], 10);
                        if (isNaN(day)) return label;
                        // Get ordinal suffix
                        const suffix =
                          day % 10 === 1 && day !== 11
                            ? "st"
                            : day % 10 === 2 && day !== 12
                            ? "nd"
                            : day % 10 === 3 && day !== 13
                            ? "rd"
                            : "th";
                        return `${day}${suffix}`;
                      }
                      return label;
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: chartColors.text,
                    }}
                    tickLine={{ stroke: chartColors.axis }}
                    axisLine={{ stroke: chartColors.axis }}
                    tickFormatter={(value) => {
                      if (value === 0) return "₹0";
                      if (value >= 1000)
                        return `₹${(value / 1000).toFixed(0)}k`;
                      return `₹${value}`;
                    }}
                    domain={[0, "dataMax"]}
                    tickCount={4}
                    width={44}
                  />
                  <Tooltip
                    cursor={{
                      stroke: chartColors.text,
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div
                          className="px-3 py-2 rounded-xl border text-xs"
                          style={{
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(24, 24, 27, 0.75)"
                                : "rgba(255, 255, 255, 0.75)",
                            borderColor:
                              theme === "dark"
                                ? "rgba(63, 63, 70, 0.5)"
                                : "rgba(228, 228, 231, 0.8)",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                          }}
                        >
                          <p className="text-muted-foreground mb-1">{label}</p>
                          <p
                            className="font-mono font-semibold"
                            style={{
                              color: theme === "dark" ? "#fafafa" : "#18181b",
                            }}
                          >
                            Spent: {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotoneX"
                    dataKey="total"
                    stroke="url(#lineGradient)"
                    strokeWidth={2.5}
                    fill="url(#colorSpending)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={{
                      fill: "#3b82f6",
                      strokeWidth: 2,
                      stroke: "hsl(var(--card))",
                      r: 4,
                    }}
                    activeDot={{
                      fill: "#3b82f6",
                      strokeWidth: 3,
                      stroke: "hsl(var(--card))",
                      r: 6,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-medium text-center">
              Spending by Category{" "}
              <span className="text-[10px] font-normal text-muted-foreground">
                (excluding bills)
              </span>
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Gradient definitions for each slice */}
                  <defs>
                    {pieData.map((entry, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`pieGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    stroke={theme === "dark" ? "#27272a" : "#ffffff"}
                    strokeWidth={2}
                    activeIndex={activeIndex}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    label={(props) => renderCustomLabel({ ...props, theme })}
                    activeShape={(props: unknown) => {
                      const {
                        cx,
                        cy,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle,
                        fill,
                      } = props as {
                        cx: number;
                        cy: number;
                        innerRadius: number;
                        outerRadius: number;
                        startAngle: number;
                        endAngle: number;
                        fill: string;
                      };
                      return (
                        <g>
                          <path
                            d={`M ${
                              cx +
                              (innerRadius + 2) *
                                Math.cos((-startAngle * Math.PI) / 180)
                            },${
                              cy +
                              (innerRadius + 2) *
                                Math.sin((-startAngle * Math.PI) / 180)
                            }
                                A ${innerRadius + 2},${innerRadius + 2} 0 ${
                              endAngle - startAngle > 180 ? 1 : 0
                            },0 ${
                              cx +
                              (innerRadius + 2) *
                                Math.cos((-endAngle * Math.PI) / 180)
                            },${
                              cy +
                              (innerRadius + 2) *
                                Math.sin((-endAngle * Math.PI) / 180)
                            }
                                L ${
                                  cx +
                                  (outerRadius + 6) *
                                    Math.cos((-endAngle * Math.PI) / 180)
                                },${
                              cy +
                              (outerRadius + 6) *
                                Math.sin((-endAngle * Math.PI) / 180)
                            }
                                A ${outerRadius + 6},${outerRadius + 6} 0 ${
                              endAngle - startAngle > 180 ? 1 : 0
                            },1 ${
                              cx +
                              (outerRadius + 6) *
                                Math.cos((-startAngle * Math.PI) / 180)
                            },${
                              cy +
                              (outerRadius + 6) *
                                Math.sin((-startAngle * Math.PI) / 180)
                            }
                                Z`}
                            fill={fill}
                          />
                        </g>
                      );
                    }}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={`url(#pieGradient-${index})`}
                        style={{
                          cursor: "pointer",
                          outline: "none",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0];
                      const value = data.value as number;
                      const name = data.name as string;
                      const percentage = ((value / total) * 100).toFixed(0);
                      return (
                        <div
                          className="px-3 py-2 rounded-xl border text-xs"
                          style={{
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(24, 24, 27, 0.75)"
                                : "rgba(255, 255, 255, 0.75)",
                            borderColor:
                              theme === "dark"
                                ? "rgba(63, 63, 70, 0.5)"
                                : "rgba(228, 228, 231, 0.8)",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                          }}
                        >
                          <p className="text-muted-foreground mb-1">{name}</p>
                          <p
                            className="font-mono font-semibold"
                            style={{
                              color: theme === "dark" ? "#fafafa" : "#18181b",
                            }}
                          >
                            {formatCurrency(value)} ({percentage}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Category Cards - sorted by total descending */}
      <div className="space-y-1.5">
        {EXPENSE_CATEGORIES.filter((cat) => categoryTotals[cat.name]?.count > 0)
          .sort(
            (a, b) =>
              (categoryTotals[b.name]?.total ?? 0) -
              (categoryTotals[a.name]?.total ?? 0)
          )
          .map((cat, index) => {
            const data = categoryTotals[cat.name];
            return (
              <CategoryCard
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                total={data.total}
                count={data.count}
                transactions={data.transactions}
                isExpanded={expandedCategory === cat.name}
                onToggle={() =>
                  onToggleCategory(
                    expandedCategory === cat.name ? null : cat.name
                  )
                }
                onTransactionClick={onTransactionClick}
                index={index}
              />
            );
          })}
        {categoryTotals["Uncategorized"]?.count > 0 && (
          <CategoryCard
            name="Uncategorized"
            icon={null}
            total={categoryTotals["Uncategorized"].total}
            count={categoryTotals["Uncategorized"].count}
            transactions={categoryTotals["Uncategorized"].transactions}
            isExpanded={expandedCategory === "Uncategorized"}
            onToggle={() =>
              onToggleCategory(
                expandedCategory === "Uncategorized" ? null : "Uncategorized"
              )
            }
            onTransactionClick={onTransactionClick}
            index={EXPENSE_CATEGORIES.length}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
