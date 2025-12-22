import { useState } from "react";
import {
  useMutualFundWatchlist,
  type FundWithStats,
} from "@/hooks/useMutualFunds";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

interface MutualFundCardProps {
  fund: FundWithStats;
  index: number;
  theme: "light" | "dark";
  isExpanded: boolean;
  onToggle: () => void;
}

function MutualFundCard({
  fund,
  index,
  theme,
  isExpanded,
  onToggle,
}: MutualFundCardProps) {
  const isDark = theme === "dark";
  const isPositive = fund.dailyChangePercent >= 0;
  const trendColor = isPositive ? "#22c55e" : "#ef4444";

  // Mini sparkline using SVG
  const sparklinePoints = fund.navHistory.map((d, i) => {
    const minNav = Math.min(...fund.navHistory.map((h) => h.nav));
    const maxNav = Math.max(...fund.navHistory.map((h) => h.nav));
    const range = maxNav - minNav || 1;
    const x = (i / (fund.navHistory.length - 1)) * 80;
    const y = 24 - ((d.nav - minNav) / range) * 20;
    return `${x},${y}`;
  });
  const sparklinePath = `M ${sparklinePoints.join(" L ")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card
        className="overflow-hidden relative"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${trendColor}08 0%, transparent 50%)`
            : `linear-gradient(135deg, ${trendColor}05 0%, transparent 50%)`,
          borderColor: isDark ? `${trendColor}20` : `${trendColor}15`,
        }}
      >
        {/* Glass shine */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${trendColor}05 0%, transparent 40%)`
              : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%)",
          }}
        />

        {/* Collapsed View - Compact header */}
        <button
          onClick={onToggle}
          className="w-full relative z-10 px-3 flex items-center gap-2 text-left hover:bg-accent/30 transition-colors"
        >
          {/* Fund Name */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-xs truncate">{fund.shortName}</h3>
          </div>

          {/* Daily Change */}
          <div
            className="flex items-center gap-1 shrink-0"
            style={{ color: trendColor }}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="font-mono text-xs font-semibold">
              {isPositive ? "+" : ""}
              {fund.dailyChangePercent.toFixed(2)}%
            </span>
          </div>

          {/* Expand Icon */}
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded View - Full details */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="relative z-10 px-3">
                {/* Full Name */}
                <p className="text-[10px] text-muted-foreground truncate mb-3">
                  {fund.fullName}
                </p>

                {/* NAV and Sparkline */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Current NAV</p>
                    <p
                      className="text-xl font-bold font-mono"
                      style={{ color: trendColor }}
                    >
                      ₹{fund.currentNav.toFixed(2)}
                    </p>
                  </div>

                  {/* Sparkline */}
                  <svg
                    width="80"
                    height="28"
                    className="shrink-0 ml-2"
                    viewBox="0 0 80 28"
                  >
                    <defs>
                      <linearGradient
                        id={`spark-gradient-${fund.schemeCode}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={trendColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor={trendColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d={`${sparklinePath} L 80,28 L 0,28 Z`}
                      fill={`url(#spark-gradient-${fund.schemeCode})`}
                    />
                    {/* Line */}
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke={trendColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Period Returns - Annualized */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground">1D</p>
                    <p
                      className={`text-xs font-mono font-medium ${
                        fund.dailyChangePercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fund.dailyChangePercent >= 0 ? "+" : ""}
                      {fund.dailyChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground">1M</p>
                    <p
                      className={`text-xs font-mono font-medium ${
                        fund.monthChangePercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fund.monthChangePercent >= 0 ? "+" : ""}
                      {fund.monthChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground">1Y</p>
                    <p
                      className={`text-xs font-mono font-medium ${
                        fund.yearChangePercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fund.yearChangePercent >= 0 ? "+" : ""}
                      {fund.yearChangePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground">3Y</p>
                    <p
                      className={`text-xs font-mono font-medium ${
                        fund.threeYearChangePercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fund.threeYearChangePercent >= 0 ? "+" : ""}
                      {fund.threeYearChangePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground">5Y</p>
                    <p
                      className={`text-xs font-mono font-medium ${
                        fund.fiveYearChangePercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fund.fiveYearChangePercent >= 0 ? "+" : ""}
                      {fund.fiveYearChangePercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

interface MutualFundWatchlistProps {
  theme: "light" | "dark";
}

export function MutualFundWatchlist({ theme }: MutualFundWatchlistProps) {
  const { funds, loading, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

  const handleToggle = (schemeCode: number) => {
    setExpandedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeCode)) {
        next.delete(schemeCode);
      } else {
        next.add(schemeCode);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-3">
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground mb-1">
            Failed to load mutual fund data
          </p>
          <button
            onClick={refresh}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Watchlist</h3>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground">
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <motion.button
            onClick={refresh}
            disabled={isRefetching}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
            title="Refresh NAV data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${
                isRefetching ? "animate-spin" : ""
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* Fund Cards */}
      <div className="space-y-1.5">
        {funds.map((fund, index) => (
          <MutualFundCard
            key={fund.schemeCode}
            fund={fund}
            index={index}
            theme={theme}
            isExpanded={expandedFunds.has(fund.schemeCode)}
            onToggle={() => handleToggle(fund.schemeCode)}
          />
        ))}
      </div>

      {funds.length === 0 && !loading && (
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">No funds in watchlist</p>
        </Card>
      )}
    </div>
  );
}
