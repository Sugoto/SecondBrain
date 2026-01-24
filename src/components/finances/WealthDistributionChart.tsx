import { useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { formatCurrency } from "./constants";
import { getCurrentFDValue } from "./fdUtils";
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

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="space-y-3"
    >
      <Card
        className="p-4 relative overflow-hidden"
        style={{
          // Stone/iron vault aesthetic
          background: isDark
            ? "linear-gradient(145deg, rgba(39, 39, 42, 0.9) 0%, rgba(24, 24, 27, 0.9) 100%)"
            : "linear-gradient(145deg, rgba(107, 114, 128, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%)",
          border: isDark ? "1px solid #3f3f46" : "1px solid #374151",
        }}
      >
        {/* Stone texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isDark ? 0.08 : 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
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
