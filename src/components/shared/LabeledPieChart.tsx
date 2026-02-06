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
    const textColor = isDark ? "#FFFBF0" : "#1a1a1a";
    const borderColor = isDark ? "#FFFBF0" : "#1a1a1a";

    // Neo-brutalism pastel colors for pie segments
    const pastelColors = [
      "#FFE5EC", // pink
      "#FFF3CD", // yellow
      "#D4EDDA", // green
      "#CCE5FF", // blue
      "#E2D9F3", // purple
      "#FFE5D0", // orange
    ];

    return {
      tooltip: {
        trigger: "item",
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
        formatter: (params) => {
          const p = params as { name: string; value: number; percent: number };
          return `<div style="font-weight:700;font-size:13px">${p.name}</div>
           <div style="font-weight:600;margin-top:4px">${formatValue(p.value)} (${p.percent.toFixed(0)}%)</div>`;
        },
      },
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadius],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 0, // Sharp corners for neo-brutalism
            borderColor: borderColor,
            borderWidth: 2.5,
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
                fontSize: 10,
                fontWeight: 700,
                color: textColor,
              },
              percent: {
                fontSize: 11,
                fontWeight: 800,
              },
            },
            color: textColor,
            minMargin: 5,
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 10,
            smooth: 0,
            lineStyle: {
              width: 2,
              type: "solid",
              color: borderColor,
            },
          },
          labelLayout: {
            hideOverlap: false,
          },
          emphasis: {
            itemStyle: {
              // Just increase border width on hover, no shadow offset
              borderWidth: 4,
            },
            scale: true,
            scaleSize: 6,
          },
          data: data.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              // Use pastel colors or fall back to item color
              color: pastelColors[index % pastelColors.length] || item.color,
            },
            label: {
              rich: {
                percent: {
                  color: isDark ? pastelColors[index % pastelColors.length] : "#1a1a1a",
                },
              },
            },
            labelLine: {
              lineStyle: {
                color: borderColor,
              },
            },
          })),
          animationType: "scale",
          animationEasing: "cubicOut",
          animationDelay: (_idx: number) => _idx * 60,
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

export default LabeledPieChart;
