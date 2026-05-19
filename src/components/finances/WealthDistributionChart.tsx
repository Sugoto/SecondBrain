import { useMemo, memo } from "react";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import type { UserStats } from "@/lib/supabase";
import { LabeledPieChart } from "@/components/shared";

const ASSET_CONFIG = [
  { key: "bank_savings" as const, label: "Bank Savings" },
  { key: "mutual_funds" as const, label: "Mutual Funds" },
  { key: "ppf" as const, label: "PPF" },
  { key: "epf" as const, label: "EPF" },
] as const;

interface WealthDistributionChartProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export const WealthDistributionChart = memo(function WealthDistributionChart({
  userStats,
  theme,
}: WealthDistributionChartProps) {
  const formatCurrency = useFormatCurrency();
  const pieData = useMemo(() => {
    if (!userStats) return [];

    const isDark = theme === "dark";
    const ramp = isDark
      ? [
          "oklch(92% 0.005 275)",
          "oklch(75% 0.01 275)",
          "oklch(55% 0.01 275)",
          "oklch(40% 0.01 275)",
        ]
      : [
          "oklch(15% 0.005 275)",
          "oklch(35% 0.01 275)",
          "oklch(55% 0.01 275)",
          "oklch(75% 0.01 275)",
        ];

    const items = ASSET_CONFIG.map((asset) => ({
      name: asset.label,
      value: userStats[asset.key] || 0,
    })).filter((item) => item.value > 0);

    items.sort((a, b) => b.value - a.value);

    return items.map((item, i) => ({
      ...item,
      color: ramp[Math.min(i, ramp.length - 1)],
    }));
  }, [userStats, theme]);

  if (pieData.length === 0) {
    return null;
  }

  return (
    <section className="px-6 pt-7 pb-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
        Wealth Distribution
      </p>
      <div className="h-44 flex items-center justify-center">
        <LabeledPieChart
          data={pieData}
          theme={theme}
          formatValue={formatCurrency}
          size={170}
        />
      </div>
    </section>
  );
});
