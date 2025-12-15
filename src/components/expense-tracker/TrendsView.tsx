import { useMemo } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, EXPENSE_CATEGORIES, getCategoryColor } from "./constants";
import { getMonthlyAmount, isProratedInMonth } from "./utils";
import { Footer } from "./Footer";
import type { ChartMode } from "./types";
import { TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface TrendsViewProps {
  transactions: Transaction[];
  chartMode: ChartMode;
}

export function TrendsView({ transactions, chartMode }: TrendsViewProps) {
  const { theme } = useTheme();
  
  // Theme-aware colors for SVG elements (CSS variables don't work reliably in SVG)
  const chartColors = useMemo(() => ({
    text: theme === "dark" ? "#a1a1aa" : "#71717a",
    grid: theme === "dark" ? "#3f3f46" : "#e4e4e7",
    axis: theme === "dark" ? "#52525b" : "#d4d4d8",
    tooltip: {
      bg: theme === "dark" ? "#18181b" : "#ffffff",
      border: theme === "dark" ? "#3f3f46" : "#e4e4e7",
    },
  }), [theme]);

  // Check if we have any expense transactions at all
  const hasExpenses = useMemo(
    () => transactions.some((t) => t.type === "expense"),
    [transactions]
  );
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
        .filter((t) => t.date === dateStr && t.type === "expense")
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
          if (t.type !== "expense") return false;
          
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

  // Category breakdown based on chart mode period
  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);

    if (chartMode === "daily") {
      cutoffDate.setDate(cutoffDate.getDate() - 14);
    } else {
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    }

    const filtered = transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= cutoffDate;
    });

    const breakdown: { name: string; value: number; color: string }[] = [];

    EXPENSE_CATEGORIES.forEach((cat) => {
      const total = filtered
        .filter((t) => t.category === cat.name && t.type === "expense")
        .reduce((sum, t) => sum + getMonthlyAmount(t), 0);
      if (total > 0) {
        breakdown.push({
          name: cat.name,
          value: total,
          color: getCategoryColor(cat.name),
        });
      }
    });

    const uncategorized = filtered
      .filter((t) => !t.category && t.type === "expense")
      .reduce((sum, t) => sum + getMonthlyAmount(t), 0);
    if (uncategorized > 0) {
      breakdown.push({ name: "Other", value: uncategorized, color: "#94a3b8" });
    }

    return breakdown.sort((a, b) => b.value - a.value);
  }, [transactions, chartMode]);

  const chartData = chartMode === "daily" ? dailyData : monthlyData;
  const totalPeriod = categoryBreakdown.reduce((sum, c) => sum + c.value, 0);

  // Empty state
  if (!hasExpenses) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground">
              No expense data to display
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Add some expenses to see your spending trends
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
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  {/* Glow filter for the line */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
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
                        day % 10 === 1 && day !== 11 ? "st" :
                        day % 10 === 2 && day !== 12 ? "nd" :
                        day % 10 === 3 && day !== 13 ? "rd" : "th";
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
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
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
                          backgroundColor: theme === "dark" ? "rgba(24, 24, 27, 0.75)" : "rgba(255, 255, 255, 0.75)",
                          borderColor: theme === "dark" ? "rgba(63, 63, 70, 0.5)" : "rgba(228, 228, 231, 0.8)",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                          backdropFilter: "blur(16px)",
                          WebkitBackdropFilter: "blur(16px)",
                        }}
                      >
                        <p className="text-muted-foreground mb-1">{label}</p>
                        <p className="font-mono font-semibold" style={{ color: theme === "dark" ? "#fafafa" : "#18181b" }}>
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
                    filter: "url(#glow)",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Category Breakdown</h3>
              <span className="text-xs text-muted-foreground font-mono">
                Total: {formatCurrency(totalPeriod)}
              </span>
            </div>
            <div className="space-y-3">
              {categoryBreakdown.map((cat, index) => {
                const percentage = (cat.value / totalPeriod) * 100;
                // Generate lighter shade for gradient
                const lighterColor = cat.color + "99";
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">
                        {formatCurrency(cat.value)}{" "}
                        <span className="opacity-60">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          delay: 0.2 + index * 0.05,
                          duration: 0.6,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className="h-full rounded-full relative"
                        style={{
                          background: `linear-gradient(90deg, ${cat.color} 0%, ${lighterColor} 100%)`,
                          boxShadow: `0 0 8px ${cat.color}40`,
                        }}
                      >
                        {/* Shine effect */}
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)",
                          }}
                      />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      <Footer />
    </div>
  );
}
