import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "./constants";
import { getCurrentFDValue } from "./fdUtils";
import type { UserStats } from "@/lib/supabase";
import { LabeledPieChart } from "@/components/shared";

const ASSET_CONFIG = [
  { key: "bank_savings" as const, label: "Bank Savings" },
  { key: "fixed_deposits" as const, label: "Fixed Deposits" },
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
  const pieData = useMemo(() => {
    if (!userStats) return [];

    return ASSET_CONFIG.map((asset) => {
      let value = userStats[asset.key] || 0;

      if (asset.key === "fixed_deposits") {
        value = getCurrentFDValue(userStats.fixed_deposits || 0);
      }

      return {
        name: asset.label,
        value,
        color: "",
      };
    }).filter((item) => item.value > 0);
  }, [userStats]);

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
      <div className="p-3 rounded-xl border border-border bg-card">
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
