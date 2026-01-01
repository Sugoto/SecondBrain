import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface LabeledPieChartProps {
  data: PieChartDataItem[];
  theme: "light" | "dark";
  size?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  labelThreshold?: number;
  formatValue?: (value: number) => string;
}

export const LabeledPieChart = memo(function LabeledPieChart({
  data,
  theme,
  size = 240,
  innerRadius = "25%",
  outerRadius = "40%",
  labelThreshold = 0,
  formatValue = (v) => `₹${v.toLocaleString("en-IN")}`,
}: LabeledPieChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#a1a1aa" : "#71717a";

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: isDark
          ? "rgba(24, 24, 27, 0.8)"
          : "rgba(255, 255, 255, 0.85)",
        borderColor: isDark
          ? "rgba(63, 63, 70, 0.5)"
          : "rgba(228, 228, 231, 0.6)",
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: isDark ? "#fafafa" : "#18181b",
          fontSize: 12,
        },
        extraCssText: `
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          box-shadow: ${
            isDark
              ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
          };
        `,
        formatter: (params) => {
          const p = params as { name: string; value: number; percent: number };
          return `<div style="font-weight:500">${p.name}</div>
           <div style="color:${textColor}">${formatValue(p.value)} (${p.percent.toFixed(0)}%)</div>`;
        },
      },
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadius],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: isDark ? "#27272a" : "#ffffff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: (params) => {
              const p = params as { name: string; percent: number };
              if (p.percent < labelThreshold * 100) return "";
              return `{name|${p.name}}\n{percent|${p.percent.toFixed(0)}%}`;
            },
            rich: {
              name: {
                fontSize: 9,
                fontWeight: 500,
                color: textColor,
              },
              percent: {
                fontSize: 9,
                fontWeight: 600,
              },
            },
            color: textColor,
            minMargin: 5,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8,
            smooth: 0.2,
            lineStyle: {
              width: 1.5,
              type: "solid",
            },
          },
          labelLayout: {
            hideOverlap: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
            scale: true,
            scaleSize: 6,
          },
          data: data.map((item) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: item.color },
                  { offset: 1, color: adjustColorOpacity(item.color, 0.7) },
                ],
              },
            },
            label: {
              rich: {
                percent: {
                  color: item.color,
                },
              },
            },
            labelLine: {
              lineStyle: {
                color: adjustColorOpacity(item.color, 0.6),
              },
            },
          })),
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDelay: (_idx: number) => _idx * 50,
        },
      ],
    };
  }, [data, theme, innerRadius, outerRadius, labelThreshold, formatValue]);

  // Don't render if no valid data
  if (!data || data.length === 0 || total === 0) return null;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: size }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
});

// Helper to adjust color opacity (works with hex colors)
function adjustColorOpacity(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default LabeledPieChart;
