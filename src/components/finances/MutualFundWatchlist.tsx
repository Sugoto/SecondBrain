import { useState, memo, useMemo, useCallback } from "react";
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

interface FundSectionProps {
  fund: FundWithStats;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  investments: Investment[];
  onAddInvestment: (amount: number, date: string) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
}

const FundSection = memo(function FundSection({
  fund,
  index,
  isExpanded,
  onToggle,
  investments,
  onAddInvestment,
  onDeleteInvestment,
}: FundSectionProps) {
  const [investAmount, setInvestAmount] = useState("");
  const [investDate, setInvestDate] = useState("");
  const [adding, setAdding] = useState(false);

  // Memoize investment stats to avoid recalculation
  const investmentStats = useMemo(() => {
    const totalUnits = investments.reduce((sum, i) => sum + i.units, 0);
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const currentValue = totalUnits * fund.currentNav;
    const previousValue = totalUnits * fund.previousNav;
    const netChange = currentValue - totalInvested;
    const dailyChangeAmount = currentValue - previousValue;
    
    return {
      totalUnits,
      totalInvested,
      currentValue,
      previousValue,
      netChange,
      dailyChangeAmount,
      hasInvestments: investments.length > 0,
      isNetUp: netChange >= 0,
      isPositiveDay: dailyChangeAmount >= 0,
    };
  }, [investments, fund.currentNav, fund.previousNav]);

  const { currentValue, netChange, dailyChangeAmount, hasInvestments, isNetUp, isPositiveDay } = investmentStats;
  const dayColor = isPositiveDay ? "#22c55e" : "#ef4444";

  // Memoize sparkline calculation - O(n) instead of O(n²)
  const sparklinePath = useMemo(() => {
    const history = fund.navHistory;
    if (history.length === 0) return "";
    
    let minNav = history[0].nav;
    let maxNav = history[0].nav;
    for (const h of history) {
      if (h.nav < minNav) minNav = h.nav;
      if (h.nav > maxNav) maxNav = h.nav;
    }
    
    const range = maxNav - minNav || 1;
    const points = history.map((d, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 24 - ((d.nav - minNav) / range) * 20;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [fund.navHistory]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="border-t border-border/50 first:border-t-0"
    >
      {/* Fund Header */}
      <button
        onClick={onToggle}
        className="w-full py-2.5 flex items-center gap-2 text-left hover:bg-accent/20 transition-colors"
      >
        {/* Trend indicator */}
        <div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dayColor }}
        />

        {/* Fund Name */}
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-xs truncate">{fund.shortName}</h4>
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
          className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${
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
            <div className="pb-3">
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
                    <stop offset="0%" stopColor={dayColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={dayColor} stopOpacity={0} />
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
              <div className="flex items-center mb-3">
                {[
                  { label: "1D", value: fund.dailyChangePercent },
                  { label: "1M", value: fund.monthChangePercent },
                  { label: "1Y", value: fund.yearChangePercent },
                  { label: "3Y", value: fund.threeYearChangePercent },
                  { label: "5Y", value: fund.fiveYearChangePercent },
                ].map((period, idx) => (
                  <div key={period.label} className="flex items-center flex-1">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        {period.label}
                      </p>
                      <p
                        className={`text-xs font-mono font-medium ${
                          period.value >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {period.value >= 0 ? "+" : ""}
                        {period.value.toFixed(1)}%
                      </p>
                    </div>
                    {idx < 4 && <div className="w-px h-6 bg-border/50" />}
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
    </motion.div>
  );
});

interface MutualFundWatchlistProps {
  theme: "light" | "dark";
}

export function MutualFundWatchlist({ theme }: MutualFundWatchlistProps) {
  const { funds, loading, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

  const isDark = theme === "dark";
  
  // Memoize investments to prevent dependency array changes
  const investments = useMemo(() => userStats?.investments || [], [userStats?.investments]);

  const handleToggle = useCallback((schemeCode: number) => {
    setExpandedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeCode)) {
        next.delete(schemeCode);
      } else {
        next.add(schemeCode);
      }
      return next;
    });
  }, []);

  const handleAddInvestment = useCallback(async (
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
  }, [addInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    try {
      await deleteInvestment(id);
      toast.success("Investment removed");
    } catch {
      toast.error("Failed to remove investment");
    }
  }, [deleteInvestment]);

  // Memoize investments lookup by fund to avoid array recreation
  const investmentsByFund = useMemo(() => {
    const map = new Map<number, Investment[]>();
    for (const inv of investments) {
      const existing = map.get(inv.schemeCode) || [];
      existing.push(inv);
      map.set(inv.schemeCode, existing);
    }
    return map;
  }, [investments]);

  const getInvestmentsForFund = useCallback((schemeCode: number) =>
    investmentsByFund.get(schemeCode) || [], [investmentsByFund]);

  // Memoize portfolio totals calculation
  const portfolioTotals = useMemo(() => {
    let invested = 0;
    let current = 0;
    let dailyChange = 0;
    
    for (const fund of funds) {
      const fundInvestments = investmentsByFund.get(fund.schemeCode) || [];
      let totalUnits = 0;
      let totalInvested = 0;
      
      for (const inv of fundInvestments) {
        totalUnits += inv.units;
        totalInvested += inv.amount;
      }
      
      const currentValue = totalUnits * fund.currentNav;
      const previousValue = totalUnits * fund.previousNav;
      
      invested += totalInvested;
      current += currentValue;
      dailyChange += currentValue - previousValue;
    }
    
    return { invested, current, dailyChange };
  }, [funds, investmentsByFund]);

  const hasPortfolio = portfolioTotals.current > 0;
  const netChange = portfolioTotals.current - portfolioTotals.invested;
  const isNetUp = netChange >= 0;
  const isPortfolioUp = portfolioTotals.dailyChange >= 0;
  const trendColor = isPortfolioUp ? "#22c55e" : "#ef4444";

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Mutual Funds</h3>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header - Outside the card */}
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

      {/* Single Collapsible Card */}
      <Card
        className="overflow-hidden relative py-0"
        style={{
          background: hasPortfolio
            ? isDark
              ? `linear-gradient(135deg, ${trendColor}08 0%, transparent 50%)`
              : `linear-gradient(135deg, ${trendColor}05 0%, transparent 50%)`
            : undefined,
          borderColor: hasPortfolio
            ? isDark
              ? `${trendColor}20`
              : `${trendColor}15`
            : undefined,
        }}
      >
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-accent/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            {hasPortfolio ? (
              isPortfolioUp ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )
            ) : null}
            <span className="text-sm font-bold font-mono">
              ₹
              {portfolioTotals.current.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasPortfolio && (
              <>
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
                  {Math.abs(portfolioTotals.dailyChange).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                  )
                </span>
              </>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isCardExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence initial={false}>
          {isCardExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                {/* Divider */}
                <div className="h-px bg-border/50 mb-2" />

                {/* Fund List */}
                {funds.length > 0 ? (
                  <div>
                    {funds.map((fund, index) => (
                      <FundSection
                        key={fund.schemeCode}
                        fund={fund}
                        index={index}
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
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No funds in watchlist
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
