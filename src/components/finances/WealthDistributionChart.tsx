import { useMemo, memo } from "react";
import { motion } from "framer-motion";
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
    // Single-hue indigo ramp: deepest shade first (largest slice), fading out
    const ramp = isDark
      ? ["#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca"]
      : ["#3730a3", "#4338ca", "#6366f1", "#818cf8", "#a5b4fc"];

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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="space-y-2"
    >
      <div className="p-3 rounded-2xl border border-outline-variant bg-card">
        <div className="relative h-40 flex items-center justify-center">
          <LabeledPieChart
            data={pieData}
            theme={theme}
            formatValue={formatCurrency}
            size={160}
          />
        </div>
      </div>
    </motion.div>
  );
});
