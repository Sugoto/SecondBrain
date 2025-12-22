import { useState } from "react";
import {
  useMutualFundWatchlist,
  fetchNavForDate,
  type FundWithStats,
} from "@/hooks/useMutualFunds";
import { useUserStats } from "@/hooks/useExpenseData";
import type { Investment } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  ChevronDown,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface MutualFundCardProps {
  fund: FundWithStats;
  index: number;
  theme: "light" | "dark";
  isExpanded: boolean;
  onToggle: () => void;
  investments: Investment[];
  onAddInvestment: (amount: number, date: string) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
}

function MutualFundCard({
  fund,
  index,
  theme,
  isExpanded,
  onToggle,
  investments,
  onAddInvestment,
  onDeleteInvestment,
}: MutualFundCardProps) {
  const isDark = theme === "dark";
  const [investAmount, setInvestAmount] = useState("");
  const [investDate, setInvestDate] = useState("");
  const [adding, setAdding] = useState(false);

  // Calculate investment stats
  const totalUnits = investments.reduce((sum, i) => sum + i.units, 0);
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const currentValue = totalUnits * fund.currentNav;
  const hasInvestments = investments.length > 0;

  // Net change (total return)
  const netChange = currentValue - totalInvested;
  const isNetUp = netChange >= 0;

  // Daily change - calculate amount change based on previous day's value
  const previousValue = totalUnits * fund.previousNav;
  const dailyChangeAmount = currentValue - previousValue;
  const isPositiveDay = dailyChangeAmount >= 0;
  const dayColor = isNetUp ? "#22c55e" : "#ef4444";

  // Sparkline
  const sparklinePoints = fund.navHistory.map((d, i) => {
    const minNav = Math.min(...fund.navHistory.map((h) => h.nav));
    const maxNav = Math.max(...fund.navHistory.map((h) => h.nav));
    const range = maxNav - minNav || 1;
    const x = (i / (fund.navHistory.length - 1)) * 100;
    const y = 24 - ((d.nav - minNav) / range) * 20;
    return `${x},${y}`;
  });
  const sparklinePath = `M ${sparklinePoints.join(" L ")}`;

  const handleInvest = async () => {
    if (!investAmount || !investDate) {
      toast.error("Please fill all fields");
      return;
    }
    setAdding(true);
    try {
      await onAddInvestment(parseFloat(investAmount), investDate);
      setInvestAmount("");
      setInvestDate("");
    } catch {
      // Error handled in parent
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <Card
          className="overflow-hidden relative py-2"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${dayColor}08 0%, transparent 50%)`
              : `linear-gradient(135deg, ${dayColor}05 0%, transparent 50%)`,
            borderColor: isDark ? `${dayColor}20` : `${dayColor}15`,
          }}
        >
          {/* Collapsed View */}
          <button
            onClick={onToggle}
            className="w-full relative z-10 px-3 flex items-center gap-2 text-left hover:bg-accent/30 transition-colors"
          >
            {/* Fund Name */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs truncate">
                {fund.shortName}
              </h3>
            </div>

            {/* Current Value + Changes */}
            {hasInvestments && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-bold font-mono">
                  ₹
                  {currentValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span
                  className="text-[10px] font-mono font-medium"
                  style={{ color: isNetUp ? "#22c55e" : "#ef4444" }}
                >
                  {isNetUp ? "+" : "-"}₹
                  {Math.abs(netChange).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: isPositiveDay ? "#22c55e" : "#ef4444" }}
                >
                  ({isPositiveDay ? "+" : "-"}₹
                  {Math.abs(dailyChangeAmount).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                  )
                </span>
              </div>
            )}

            {/* Expand Icon */}
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Expanded View */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="relative z-10 px-3 pb-3">
                  {/* Full Name */}
                  <p className="text-[10px] text-muted-foreground truncate mb-2">
                    {fund.fullName}
                  </p>

                  {/* Sparkline */}
                  <svg
                    width="100%"
                    height="28"
                    className="mb-3"
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
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
                          stopColor={dayColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor={dayColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d={`${sparklinePath} L 100,28 L 0,28 Z`}
                      fill={`url(#spark-gradient-${fund.schemeCode})`}
                    />
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke={dayColor}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Period Returns */}
                  <div className="flex items-center gap-1 mb-3">
                    {[
                      { label: "1D", value: fund.dailyChangePercent },
                      { label: "1M", value: fund.monthChangePercent },
                      { label: "1Y", value: fund.yearChangePercent },
                      { label: "3Y", value: fund.threeYearChangePercent },
                      { label: "5Y", value: fund.fiveYearChangePercent },
                    ].map((period) => (
                      <div key={period.label} className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">
                          {period.label}
                        </p>
                        <p
                          className={`text-xs font-mono font-medium ${
                            period.value >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {period.value >= 0 ? "+" : ""}
                          {period.value.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Existing Investments */}
                  {hasInvestments && (
                    <div className="space-y-1.5 mb-3">
                      {investments.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between py-1 px-2 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">
                              ₹{inv.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(inv.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteInvestment(inv.id);
                            }}
                            className="p-1 hover:bg-red-500/10 rounded text-red-500/50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Investment Form */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="₹"
                      className="h-7 text-xs font-mono flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Input
                      type="date"
                      value={investDate}
                      onChange={(e) => setInvestDate(e.target.value)}
                      className="h-7 text-xs w-28"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInvest();
                      }}
                      disabled={adding}
                      size="sm"
                      className="h-7 text-xs px-3"
                    >
                      {adding ? "..." : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </>
  );
}

interface MutualFundWatchlistProps {
  theme: "light" | "dark";
}

export function MutualFundWatchlist({ theme }: MutualFundWatchlistProps) {
  const { funds, loading, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

  const investments = userStats?.investments || [];

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

  const handleAddInvestment = async (
    schemeCode: number,
    amount: number,
    date: string
  ) => {
    const nav = await fetchNavForDate(schemeCode, date);
    if (!nav) {
      toast.error("Could not fetch NAV for that date");
      throw new Error("NAV not found");
    }

    const units = amount / nav;

    await addInvestment({
      schemeCode,
      amount,
      date,
      nav,
      units,
    });

    toast.success(`Added ₹${amount.toLocaleString("en-IN")} investment`);
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await deleteInvestment(id);
      toast.success("Investment removed");
    } catch {
      toast.error("Failed to remove investment");
    }
  };

  const getInvestmentsForFund = (schemeCode: number) =>
    investments.filter((i) => i.schemeCode === schemeCode);

  // Calculate portfolio totals
  const portfolioTotals = funds.reduce(
    (acc, fund) => {
      const fundInvestments = getInvestmentsForFund(fund.schemeCode);
      const totalUnits = fundInvestments.reduce((sum, i) => sum + i.units, 0);
      const totalInvested = fundInvestments.reduce(
        (sum, i) => sum + i.amount,
        0
      );
      const currentValue = totalUnits * fund.currentNav;
      const previousValue = totalUnits * fund.previousNav;
      return {
        invested: acc.invested + totalInvested,
        current: acc.current + currentValue,
        dailyChange: acc.dailyChange + (currentValue - previousValue),
      };
    },
    { invested: 0, current: 0, dailyChange: 0 }
  );
  const hasPortfolio = portfolioTotals.current > 0;
  const netChange = portfolioTotals.current - portfolioTotals.invested;
  const isNetUp = netChange >= 0;
  const isPortfolioUp = portfolioTotals.dailyChange >= 0;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
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
        <h3 className="text-sm font-semibold">Mutual Funds</h3>
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
            title="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${
                isRefetching ? "animate-spin" : ""
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* Portfolio Total */}
      {hasPortfolio && (
        <Card className="px-3 py-2">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {isNetUp ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-bold font-mono">
                ₹
                {portfolioTotals.current.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-medium"
                style={{ color: isNetUp ? "#22c55e" : "#ef4444" }}
              >
                {isNetUp ? "+" : "-"}₹
                {Math.abs(netChange).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: isPortfolioUp ? "#22c55e" : "#ef4444" }}
              >
                ({isPortfolioUp ? "+" : "-"}₹
                {Math.abs(portfolioTotals.dailyChange).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
                )
              </span>
            </div>
          </div>
        </Card>
      )}

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
            investments={getInvestmentsForFund(fund.schemeCode)}
            onAddInvestment={(amount, date) =>
              handleAddInvestment(fund.schemeCode, amount, date)
            }
            onDeleteInvestment={handleDeleteInvestment}
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
