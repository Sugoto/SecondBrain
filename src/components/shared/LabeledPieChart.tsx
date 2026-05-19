import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
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
  innerRadius = "32%",
  outerRadius = "48%",
  labelThreshold = 0,
  formatValue = (v) => `₹${v.toLocaleString("en-IN")}`,
  formatLabel,
}: LabeledPieChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  );

  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "oklch(72% 0.01 275)" : "oklch(40% 0.01 275)";
    const subtleLine = isDark ? "oklch(35% 0.01 275)" : "oklch(85% 0.01 275)";
    const bgColor = isDark ? "oklch(13% 0.005 275)" : "oklch(98% 0.005 275)";

    const monoRamp = isDark
      ? [
          "oklch(92% 0.005 275)",
          "oklch(75% 0.01 275)",
          "oklch(55% 0.01 275)",
          "oklch(40% 0.01 275)",
          "oklch(30% 0.01 275)",
          "oklch(22% 0.01 275)",
        ]
      : [
          "oklch(15% 0.005 275)",
          "oklch(30% 0.01 275)",
          "oklch(45% 0.01 275)",
          "oklch(60% 0.01 275)",
          "oklch(75% 0.01 275)",
          "oklch(85% 0.01 275)",
        ];

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: bgColor,
        borderColor: subtleLine,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: isDark ? "oklch(90% 0.005 275)" : "oklch(15% 0.005 275)",
          fontSize: 12,
          fontWeight: 400,
        },
        extraCssText: `border-radius: 8px; box-shadow: none;`,
        formatter: (params) => {
          const p = params as { name: string; value: number; percent: number };
          return `<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${textColor};margin-bottom:4px">${p.name}</div>
           <div style="font-family:'Google Sans Mono',monospace;font-size:13px">${formatValue(p.value)} · ${p.percent.toFixed(0)}%</div>`;
        },
      },
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadius],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 0,
            borderColor: bgColor,
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: (params) => {
              const p = params as { name: string; value: number; percent: number };
              if (p.percent < labelThreshold * 100) return "";
              const detail = formatLabel
                ? formatLabel(p.name, p.value)
                : `${p.percent.toFixed(0)}%`;
              return `{name|${p.name}}\n{percent|${detail}}`;
            },
            rich: {
              name: {
                fontSize: 9,
                fontWeight: 500,
                color: textColor,
                letterSpacing: 1.5,
              },
              percent: {
                fontSize: 11,
                fontWeight: 400,
                fontFamily: "Google Sans Mono, monospace",
                color: isDark ? "oklch(90% 0.005 275)" : "oklch(15% 0.005 275)",
                padding: [2, 0, 0, 0],
              },
            },
            color: textColor,
            minMargin: 5,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8,
            smooth: 0,
            lineStyle: {
              width: 1,
              type: "solid",
              color: subtleLine,
            },
          },
          labelLayout: { hideOverlap: false },
          emphasis: {
            itemStyle: { borderWidth: 2 },
            scale: false,
          },
          data: data.map((item, index) => {
            const color = item.color || monoRamp[index % monoRamp.length];
            return {
              name: item.name,
              value: item.value,
              itemStyle: { color },
            };
          }),
          animationType: "scale",
          animationEasing: "cubicOut",
          animationDelay: (_idx: number) => _idx * 40,
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
