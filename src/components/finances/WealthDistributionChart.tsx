import { useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { formatCurrency } from "./constants";
import type { UserStats } from "@/lib/supabase";
import { LabeledPieChart } from "@/components/shared";

// Asset categories with colors matching the edit dialog
const ASSET_CONFIG = [
  { key: "bank_savings" as const, label: "Bank Savings", color: "#10b981" }, // emerald-500
  { key: "fixed_deposits" as const, label: "Fixed Deposits", color: "#3b82f6" }, // blue-500
  { key: "mutual_funds" as const, label: "Mutual Funds", color: "#8b5cf6" }, // violet-500
  { key: "ppf" as const, label: "PPF", color: "#f59e0b" }, // amber-500
  { key: "epf" as const, label: "EPF", color: "#f43f5e" }, // rose-500
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

    return ASSET_CONFIG.map((asset) => ({
      name: asset.label,
      value: userStats[asset.key] || 0,
      color: asset.color,
    })).filter((item) => item.value > 0);
  }, [userStats]);

  if (pieData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="p-4">
        <h3 className="text-sm font-medium text-center">Portfolio</h3>
        <div className="h-48 flex items-center justify-center">
          <LabeledPieChart
            data={pieData}
            theme={theme}
            innerRadius={45}
            outerRadius={65}
            formatValue={formatCurrency}
          />
        </div>
      </Card>
    </motion.div>
  );
});
