import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryColor,
} from "./constants";
import { CategoryCard } from "./CategoryCard";
import { Footer } from "./Footer";
import type { CategoryTotal } from "./utils";
import { useTheme } from "@/hooks/useTheme";

interface CategoriesViewProps {
  categoryTotals: Record<string, CategoryTotal>;
  chartCategoryTotals: Record<string, CategoryTotal>; // Excludes budget-excluded for pie chart
  expandedCategory: string | null;
  onToggleCategory: (name: string | null) => void;
  onTransactionClick: (txn: Transaction) => void;
}

export function CategoriesView({
  categoryTotals,
  chartCategoryTotals,
  expandedCategory,
  onToggleCategory,
  onTransactionClick,
}: CategoriesViewProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

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
  const hasCategories = EXPENSE_CATEGORIES.some(
    (cat) => categoryTotals[cat.name]?.count > 0
  ) || categoryTotals["Uncategorized"]?.count > 0;

  if (!hasCategories) {
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
      {/* Pie Chart */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2 text-center">
              Spending by Category
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* SVG definitions for glow effects */}
                  <defs>
                    <filter
                      id="pieGlow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    {/* Gradient definitions for each slice */}
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
                    innerRadius={55}
                    outerRadius={80}
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
                            style={{ filter: "url(#pieGlow)" }}
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
                          filter: "url(#pieGlow)",
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
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1 text-[10px]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Category Cards - sorted by total descending */}
      <div className="space-y-2">
        {EXPENSE_CATEGORIES
          .filter((cat) => categoryTotals[cat.name]?.count > 0)
          .sort((a, b) => (categoryTotals[b.name]?.total ?? 0) - (categoryTotals[a.name]?.total ?? 0))
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
