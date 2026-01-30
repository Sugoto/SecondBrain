import { useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { formatCurrency } from "./constants";
import { getCurrentFDValue } from "./fdUtils";
import type { UserStats } from "@/lib/supabase";
import { LabeledPieChart } from "@/components/shared";

// Asset categories with monochromatic colors
const ASSET_CONFIG = [
  { key: "bank_savings" as const, label: "Bank Savings", color: "#171717" },
  { key: "fixed_deposits" as const, label: "Fixed Deposits", color: "#404040" },
  { key: "mutual_funds" as const, label: "Mutual Funds", color: "#525252" },
  { key: "ppf" as const, label: "PPF", color: "#737373" },
  { key: "epf" as const, label: "EPF", color: "#a3a3a3" },
] as const;

interface WealthDistributionChartProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
  mutualFundsValue?: number; // Real-time MF portfolio value
}

export const WealthDistributionChart = memo(function WealthDistributionChart({
  userStats,
  theme,
  mutualFundsValue,
}: WealthDistributionChartProps) {
  const pieData = useMemo(() => {
    if (!userStats) return [];

    return ASSET_CONFIG.map((asset) => {
      let value = userStats[asset.key] || 0;
      
      // Use real-time values for FD and MF
      if (asset.key === "fixed_deposits") {
        value = getCurrentFDValue(userStats.fixed_deposits || 0);
      } else if (asset.key === "mutual_funds" && mutualFundsValue !== undefined) {
        value = mutualFundsValue;
      }
      
      return {
        name: asset.label,
        value,
        color: asset.color,
      };
    }).filter((item) => item.value > 0);
  }, [userStats, mutualFundsValue]);

  if (pieData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="space-y-3"
    >
      <Card className="p-4 border border-border bg-card">
        <div className="relative h-48 flex items-center justify-center">
          <LabeledPieChart
            data={pieData}
            theme={theme}
            formatValue={formatCurrency}
          />
        </div>
      </Card>
    </motion.div>
  );
});
