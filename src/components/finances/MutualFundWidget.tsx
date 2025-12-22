import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useMutualFundWatchlist } from "@/hooks/useMutualFunds";

export function MutualFundWidget() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { funds, loading } = useMutualFundWatchlist();
  const { userStats } = useUserStats();

  const portfolioData = useMemo(() => {
    if (loading || funds.length === 0) return null;

    const investments = userStats?.investments || [];

    let invested = 0;
    let current = 0;
    let dailyChange = 0;

    funds.forEach((fund) => {
      const fundInvestments = investments.filter(
        (i) => i.schemeCode === fund.schemeCode
      );
      const totalUnits = fundInvestments.reduce((sum, i) => sum + i.units, 0);
      const totalInvested = fundInvestments.reduce((sum, i) => sum + i.amount, 0);
      const currentValue = totalUnits * fund.currentNav;
      const previousValue = totalUnits * fund.previousNav;

      invested += totalInvested;
      current += currentValue;
      dailyChange += currentValue - previousValue;
    });

    if (current === 0) return null;

    return {
      current,
      invested,
      netChange: current - invested,
      dailyChange,
    };
  }, [funds, userStats?.investments, loading]);

  if (loading) {
    return (
      <div className="animate-pulse flex-1 min-w-0">
        <div
          className="aspect-square rounded-2xl p-2.5 sm:p-3"
          style={{
            background: isDark
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(34, 197, 94, 0.05)",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-[60%] aspect-square rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) return null;

  const { current, netChange, dailyChange } = portfolioData;
  const isNetUp = netChange >= 0;
  const isDailyUp = dailyChange >= 0;
  const trendColor = isDailyUp ? "#22c55e" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0"
    >
      <div
        className="aspect-square rounded-2xl p-2.5 sm:p-3 relative overflow-hidden flex flex-col"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${trendColor}15 0%, ${trendColor}05 100%)`
            : `linear-gradient(135deg, ${trendColor}10 0%, ${trendColor}03 100%)`,
          border: isDark
            ? `1px solid ${trendColor}30`
            : `1px solid ${trendColor}15`,
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? `radial-gradient(circle at 20% 80%, ${trendColor}20 0%, transparent 50%)`
              : `radial-gradient(circle at 20% 80%, ${trendColor}10 0%, transparent 50%)`,
          }}
        />

        {/* Header */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          <div
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: isDailyUp
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            {isDailyUp ? (
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Mutual Funds
          </span>
        </div>

        {/* Main Value */}
        <div className="relative flex-1 flex flex-col items-center justify-center min-h-0">
          <span
            className="text-lg sm:text-xl font-bold font-mono"
            style={{
              color: trendColor,
              textShadow: isDark ? `0 0 20px ${trendColor}40` : "none",
            }}
          >
            ₹{current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Footer stats */}
        <div className="relative grid grid-cols-2 gap-1 sm:gap-2 text-center">
          <div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              Total
            </p>
            <p
              className="text-[11px] sm:text-xs font-bold font-mono"
              style={{ color: isNetUp ? "#22c55e" : "#ef4444" }}
            >
              {isNetUp ? "+" : "-"}₹
              {Math.abs(netChange).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              Today
            </p>
            <p
              className="text-[11px] sm:text-xs font-bold font-mono"
              style={{ color: isDailyUp ? "#22c55e" : "#ef4444" }}
            >
              {isDailyUp ? "+" : "-"}₹
              {Math.abs(dailyChange).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

