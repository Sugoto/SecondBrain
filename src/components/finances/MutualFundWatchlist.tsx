import { useState, memo, useMemo, useCallback } from "react";
import {
  useMutualFundWatchlist,
  fetchNavForDate,
  type FundWithStats,
} from "@/hooks/useMutualFunds";
import { useUserStats } from "@/hooks/useExpenseData";
import type { Investment } from "@/lib/supabase";
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

// million-ignore - SVG sparkline not compatible with Million.js
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

  // Sparkline color based on daily performance
  const dayColor = isPositiveDay ? "#737373" : "#737373"; // Monochromatic

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
      className="border-t border-black/10 dark:border-white/10 first:border-t-0"
    >
      {/* Fund Header */}
      <button
        onClick={onToggle}
        className="w-full py-2 flex items-center gap-2 text-left hover:bg-pastel-yellow/30 transition-colors"
      >
        {/* Trend indicator */}
        <div className="h-5 w-5 rounded bg-pastel-blue border border-black/20 dark:border-white/20 flex items-center justify-center shrink-0">
          {isPositiveDay ? (
            <TrendingUp className="h-2.5 w-2.5 text-black dark:text-white" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 text-black dark:text-white" />
          )}
        </div>

        {/* Fund Name */}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs truncate text-foreground">{fund.shortName}</h4>
        </div>

        {/* Current Value + Changes */}
        {hasInvestments && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              ₹
              {currentValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground">
              {isNetUp ? "+" : "-"}₹
              {Math.abs(netChange).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
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
          className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""
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
              <p className="text-[10px] text-muted-foreground font-medium truncate mb-2">
                {fund.fullName}
              </p>

              {/* Sparkline */}
              <svg
                width="100%"
                height="20"
                className="mb-2"
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
              <div className="flex items-center mb-2 p-1.5 rounded-md bg-pastel-purple/30 border border-black/10 dark:border-white/10">
                {[
                  { label: "1D", value: fund.dailyChangePercent },
                  { label: "1M", value: fund.monthChangePercent },
                  { label: "1Y", value: fund.yearChangePercent },
                  { label: "3Y", value: fund.threeYearChangePercent },
                  { label: "5Y", value: fund.fiveYearChangePercent },
                ].map((period, idx) => (
                  <div key={period.label} className="flex items-center flex-1">
                    <div className="flex-1 text-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        {period.label}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-foreground">
                        {period.value >= 0 ? "+" : ""}
                        {period.value.toFixed(1)}%
                      </p>
                    </div>
                    {idx < 4 && <div className="w-px h-5 bg-black/10 dark:bg-white/10" />}
                  </div>
                ))}
              </div>

              {/* Existing Investments */}
              {hasInvestments && (
                <div className="space-y-1.5 mb-2">
                  {investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-pastel-green/30 border border-black/10 dark:border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-foreground">
                          ₹{inv.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
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
                        className="p-1 rounded hover:bg-pastel-pink border border-transparent hover:border-black/20 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Investment Form */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="₹"
                  className="h-7 text-xs font-mono flex-1 border-[1.5px] border-black dark:border-white rounded-md"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  type="date"
                  value={investDate}
                  onChange={(e) => setInvestDate(e.target.value)}
                  className="h-7 text-xs w-28 border-[1.5px] border-black dark:border-white rounded-md"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInvest();
                  }}
                  disabled={adding}
                  className="h-7 w-7 flex items-center justify-center rounded-md border-[1.5px] border-black dark:border-white bg-pastel-green text-black shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                >
                  {adding ? "..." : <Plus className="h-3 w-3" />}
                </button>
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

export function MutualFundWatchlist({ theme: _theme }: MutualFundWatchlistProps) {
  const { funds, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

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

  if (error && funds.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Mutual Funds
        </h3>
        <div className="p-3 rounded-lg border-[1.5px] border-dashed border-black/30 dark:border-white/30">
          <div className="text-center py-1">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Failed to load mutual fund data
            </p>
            <button
              onClick={refresh}
              className="text-xs font-bold text-foreground hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Mutual Funds
        </h3>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <p className="text-[10px] font-medium text-muted-foreground">
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
            className="h-6 w-6 flex items-center justify-center rounded-md border-[1.5px] border-black dark:border-white bg-pastel-blue text-black dark:text-white shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""
                }`}
            />
          </motion.button>
        </div>
      </div>

      {/* Single Collapsible Card */}
      <div className="overflow-hidden rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-pastel-yellow/30 transition-colors"
        >
          <span className="text-sm font-bold font-mono text-foreground">
            ₹
            {portfolioTotals.current.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </span>

          <div className="flex items-center gap-2">
            {hasPortfolio && (
              <>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {isNetUp ? "+" : "-"}₹
                  {Math.abs(netChange).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
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
            <div className="h-5 w-5 rounded flex items-center justify-center border-[1.5px] border-black dark:border-white bg-white dark:bg-white/10">
              <ChevronDown
                className={`h-3 w-3 text-black dark:text-white transition-transform ${isCardExpanded ? "rotate-180" : ""
                  }`}
              />
            </div>
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
                <div className="h-px bg-black/10 dark:bg-white/10 mb-2" />

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
                  <div className="py-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      No funds in watchlist
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
