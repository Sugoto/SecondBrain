import { useMemo, memo } from "react";
import { useECharts } from "@/lib/echarts";
import type { EChartsOption } from "echarts";
import { usePrivacy } from "@/hooks/usePrivacy";
import { useCssVars } from "@/lib/tokens";

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

const TOKENS = ["--ui-accent", "--ui-ink", "--ui-ink-softer", "--ui-rule", "--ui-mono"] as const;

export const SalaryChart = memo(function SalaryChart({ theme }: SalaryChartProps) {
  const { hidden } = usePrivacy();
  const tokens = useCssVars(TOKENS, theme);

  const option: EChartsOption = useMemo(() => {
    const mono = tokens["--ui-mono"] || "monospace";
    const axisLabel = {
      color: tokens["--ui-ink-softer"],
      fontSize: 10,
      fontFamily: mono,
    };

    return {
      grid: { left: 30, right: 14, top: 24, bottom: 24, containLabel: false },
      xAxis: {
        type: "category",
        data: SALARY_DATA.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel,
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 40,
        interval: 10,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: tokens["--ui-rule"] } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${v}L` },
      },
      series: [
        {
          type: "line",
          data: SALARY_DATA.map((d) => d.lpa),
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: tokens["--ui-accent"] },
          lineStyle: { width: 2, color: tokens["--ui-accent"] },
          label: {
            show: true,
            position: "top",
            formatter: (params) => `${(params as { value: number }).value}L`,
            color: tokens["--ui-ink"],
            fontSize: 11,
            fontWeight: 500,
            fontFamily: mono,
          },
          animationDuration: 400,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [tokens]);

  const chartRef = useECharts(option);

  if (hidden) return null;

  return (
    <section className="ui-panel px-5 pt-5 pb-3">
      <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Salary</h2>
      <p className="mt-0.5 text-[12px] text-[var(--ui-ink-softer)]">Lakhs per year</p>
      <div ref={chartRef} className="mt-1 h-40" />
    </section>
  );
});
