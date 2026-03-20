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
  formatLabel?: (name: string, value: number) => string;
}

export const LabeledPieChart = memo(function LabeledPieChart({
  data,
  theme,
  size = 240,
  innerRadius = "25%",
  outerRadius = "40%",
  labelThreshold = 0,
  formatValue = (v) => `₹${v.toLocaleString("en-IN")}`,
  formatLabel,
}: LabeledPieChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#a3a3a3" : "#525252";
    const borderColor = isDark ? "#262626" : "#e5e5e5";
    const bgColor = isDark ? "#0a0a0a" : "#fafafa";

    const defaultColors = [
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#06b6d4",
      "#14b8a6",
      "#f59e0b",
    ];

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: isDark ? "#141414" : "#ffffff",
        borderColor,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: isDark ? "#fafafa" : "#0a0a0a",
          fontSize: 12,
          fontWeight: 500,
        },
        extraCssText: `border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,${isDark ? "0.4" : "0.08"});`,
        formatter: (params) => {
          const p = params as { name: string; value: number; percent: number };
          return `<div style="font-weight:600;font-size:13px">${p.name}</div>
           <div style="font-weight:500;margin-top:4px;color:${textColor}">${formatValue(p.value)} (${p.percent.toFixed(0)}%)</div>`;
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
            borderColor: bgColor,
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: (params) => {
              const p = params as { name: string; value: number; percent: number };
              if (p.percent < labelThreshold * 100) return "";
              const detail = formatLabel ? formatLabel(p.name, p.value) : `${p.percent.toFixed(0)}%`;
              return `{name|${p.name}}\n{percent|${detail}}`;
            },
            rich: {
              name: {
                fontSize: 10,
                fontWeight: 600,
                color: textColor,
              },
              percent: {
                fontSize: 11,
                fontWeight: 700,
              },
            },
            color: textColor,
            minMargin: 5,
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 10,
            smooth: 0.2,
            lineStyle: {
              width: 1,
              type: "solid",
              color: isDark ? "#404040" : "#d4d4d4",
            },
          },
          labelLayout: {
            hideOverlap: false,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.15)",
            },
            scale: true,
            scaleSize: 6,
          },
          data: data.map((item, index) => {
            const color = item.color || defaultColors[index % defaultColors.length];
            return {
            name: item.name,
            value: item.value,
            itemStyle: { color },
            label: {
              rich: {
                percent: {
                  color: isDark ? color : "#0a0a0a",
                },
              },
            },
            labelLine: {
              lineStyle: {
                color: isDark ? "#404040" : "#d4d4d4",
              },
            },
          }; }),
          animationType: "scale",
          animationEasing: "cubicOut",
          animationDelay: (_idx: number) => _idx * 60,
        },
      ],
    };
  }, [data, theme, innerRadius, outerRadius, labelThreshold, formatValue, formatLabel]);

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

export default LabeledPieChart;
