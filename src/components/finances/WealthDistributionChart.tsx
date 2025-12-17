import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "./constants";
import type { UserStats } from "@/lib/supabase";

// Asset categories with colors matching the edit dialog
const ASSET_CONFIG = [
  { key: "bank_savings" as const, label: "Bank Savings", color: "#10b981" }, // emerald-500
  { key: "fixed_deposits" as const, label: "Fixed Deposits", color: "#3b82f6" }, // blue-500
  { key: "mutual_funds" as const, label: "Mutual Funds", color: "#8b5cf6" }, // violet-500
  { key: "ppf" as const, label: "PPF", color: "#f59e0b" }, // amber-500
  { key: "epf" as const, label: "EPF", color: "#f43f5e" }, // rose-500
] as const;

// Custom label renderer with connecting lines
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
  // Calculate positions
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

interface WealthDistributionChartProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function WealthDistributionChart({
  userStats,
  theme,
}: WealthDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const { pieData, total } = useMemo(() => {
    if (!userStats) return { pieData: [], total: 0 };

    const data = ASSET_CONFIG.map((asset) => ({
      name: asset.label,
      value: userStats[asset.key] || 0,
      color: asset.color,
    })).filter((item) => item.value > 0);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    return { pieData: data, total };
  }, [userStats]);

  if (pieData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="p-4">
        <h3 className="text-sm font-medium text-center">Portfolio</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* SVG definitions for glow effects */}
              <defs>
                <filter
                  id="wealthPieGlow"
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
                    key={`wealth-gradient-${index}`}
                    id={`wealthPieGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
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
                        style={{ filter: "url(#wealthPieGlow)" }}
                      />
                    </g>
                  );
                }}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={`url(#wealthPieGradient-${index})`}
                    style={{
                      filter: "url(#wealthPieGlow)",
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
                  const percentage = ((value / total) * 100).toFixed(1);
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
  );
}
