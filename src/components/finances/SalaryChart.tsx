import { useMemo, memo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { usePrivacy } from "@/hooks/usePrivacy";

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
  const { hidden } = usePrivacy();
  const option: EChartsOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "oklch(72% 0.01 275)" : "oklch(40% 0.01 275)";
    const subtleLine = isDark ? "oklch(35% 0.01 275)" : "oklch(85% 0.01 275)";
    const lineColor = isDark ? "oklch(90% 0.005 275)" : "oklch(15% 0.005 275)";

    return {
      grid: { left: 36, right: 12, top: 20, bottom: 28, containLabel: false },
      xAxis: {
        type: "category",
        data: SALARY_DATA.map((d) => d.label),
        axisLine: { lineStyle: { color: subtleLine, width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 9,
          fontWeight: 500,
          fontFamily: "Google Sans Mono, monospace",
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 40,
        interval: 10,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: subtleLine, type: "solid" } },
        axisLabel: {
          color: textColor,
          fontSize: 9,
          fontWeight: 500,
          fontFamily: "Google Sans Mono, monospace",
          formatter: (v: number) => `${v}L`,
        },
      },
      series: [
        {
          type: "line",
          data: SALARY_DATA.map((d) => d.lpa),
          smooth: false,
          symbol: "circle",
          symbolSize: 5,
          itemStyle: { color: lineColor },
          lineStyle: { width: 1.5, color: lineColor },
          label: {
            show: true,
            position: "top",
            formatter: (params) => `${(params as { value: number }).value}L`,
            color: lineColor,
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Google Sans Mono, monospace",
          },
          animationDuration: 400,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [theme]);

  if (hidden) return null;

  return (
    <section className="px-6 pt-7 pb-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
        Salary Progression
      </p>
      <div className="h-40">
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          lazyUpdate
        />
      </div>
    </section>
  );
});
