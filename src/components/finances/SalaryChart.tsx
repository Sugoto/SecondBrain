import { useMemo, memo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const SALARY_DATA = [
  { label: "Nov 2023", lpa: 11 },
  { label: "Apr 2024", lpa: 12 },
  { label: "Jan 2025", lpa: 20 },
  { label: "Apr 2025", lpa: 29 },
  { label: "May 2026", lpa: 33 },
];

interface SalaryChartProps {
  theme: "light" | "dark";
}

export const SalaryChart = memo(function SalaryChart({ theme }: SalaryChartProps) {
  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#a3a3a3" : "#525252";
    const borderColor = isDark ? "#262626" : "#e5e5e5";
    const lineColor = "#6366f1";
    const areaStart = "rgba(99,102,241,0.3)";
    const areaEnd = "rgba(99,102,241,0)";

    return {
      grid: { left: 40, right: 15, top: 15, bottom: 30, containLabel: false },
      xAxis: {
        type: "category",
        data: SALARY_DATA.map((d) => d.label),
        axisLine: { lineStyle: { color: borderColor, width: 1 } },
        axisTick: { show: false },
        axisLabel: { color: textColor, fontSize: 9, fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 40,
        interval: 10,
        axisLine: { show: true, lineStyle: { color: borderColor, width: 1 } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: borderColor, type: "solid" } },
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
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: lineColor, borderColor: lineColor, borderWidth: 2 },
          lineStyle: { width: 2, color: lineColor },
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
            color: isDark ? "#fafafa" : "#0a0a0a",
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
    <div className="px-5 py-4 rounded-2xl border border-outline-variant bg-card">
      <p className="text-title-s text-foreground mb-3">
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
