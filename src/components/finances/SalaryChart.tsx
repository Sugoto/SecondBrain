import { useMemo, memo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const SALARY_DATA = [
  { label: "Nov 2023", lpa: 11 },
  { label: "Apr 2024", lpa: 12 },
  { label: "Jan 2025", lpa: 20 },
  { label: "Apr 2025", lpa: 28 },
];

interface SalaryChartProps {
  theme: "light" | "dark";
}

export const SalaryChart = memo(function SalaryChart({ theme }: SalaryChartProps) {
  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#FFFBF0" : "#1a1a1a";
    const borderColor = isDark ? "#FFFBF0" : "#1a1a1a";
    const lineColor = isDark ? "#95E1A3" : "#1a1a1a";
    const areaStart = isDark ? "rgba(149, 225, 163, 0.3)" : "rgba(212, 237, 218, 0.6)";
    const areaEnd = isDark ? "rgba(149, 225, 163, 0)" : "rgba(212, 237, 218, 0)";

    return {
      grid: { left: 40, right: 15, top: 15, bottom: 30, containLabel: false },
      xAxis: {
        type: "category",
        data: SALARY_DATA.map((d) => d.label),
        axisLine: { lineStyle: { color: borderColor, width: 2 } },
        axisTick: { show: false },
        axisLabel: { color: textColor, fontSize: 9, fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        min: 0,
        axisLine: { show: true, lineStyle: { color: borderColor, width: 2 } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: isDark ? "rgba(255,251,240,0.1)" : "rgba(26,26,26,0.1)", type: "solid" } },
        axisLabel: {
          color: textColor,
          fontSize: 9,
          fontWeight: 600,
          formatter: (v: number) => `${v}L`,
        },
      },
      series: [
        {
          type: "line",
          data: SALARY_DATA.map((d) => d.lpa),
          smooth: false,
          symbol: "rect",
          symbolSize: 8,
          itemStyle: { color: isDark ? "#D4EDDA" : "#FFE5EC", borderColor, borderWidth: 2 },
          lineStyle: { width: 3, color: lineColor },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: areaStart },
                { offset: 1, color: areaEnd },
              ],
            },
          },
          label: {
            show: true,
            position: "top",
            formatter: (params) => `${(params as { value: number }).value}L`,
            color: textColor,
            fontSize: 10,
            fontWeight: 700,
          },
          animationDuration: 600,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [theme]);

  return (
    <div className="p-3 rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
      <p className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wide mb-1">
        Salary Progression
      </p>
      <div className="h-36">
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  );
});
