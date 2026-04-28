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

  const { currentValue, hasInvestments, isPositiveDay } = investmentStats;

  const dayColor = isPositiveDay ? "#737373" : "#737373";

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
      className="border-t border-border first:border-t-0"
    >
      {/* Fund Header */}
      <button
        onClick={onToggle}
        className="w-full py-2 flex items-center gap-2 text-left transition-colors"
      >
        {/* Trend indicator */}
        <div className="h-5 w-5 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
          {isPositiveDay ? (
            <TrendingUp className="h-2.5 w-2.5 text-foreground" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 text-foreground" />
          )}
        </div>

        {/* Fund Name */}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs truncate text-foreground">{fund.shortName}</h4>
        </div>

        {hasInvestments && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              ₹
              {currentValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
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
              <div className="flex items-center mb-2 p-1.5 rounded-lg bg-muted/50 border border-border">
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
                    {idx < 4 && <div className="w-px h-5 bg-border" />}
                  </div>
                ))}
              </div>

              {/* Existing Investments */}
              {hasInvestments && (
                <div className="space-y-1.5 mb-2">
                  {investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50 border border-border"
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
                        className="p-1 rounded-lg border border-transparent text-muted-foreground transition-all"
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
                  className="h-7 text-xs font-mono flex-1 border border-border rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  type="date"
                  value={investDate}
                  onChange={(e) => setInvestDate(e.target.value)}
                  className="h-7 text-xs w-28 border border-border rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInvest();
                  }}
                  disabled={adding}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-primary text-primary-foreground transition-all disabled:opacity-50"
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

export function MutualFundWatchlist() {
  const { funds, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

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

  }, [addInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    try {
      await deleteInvestment(id);
    } catch {
    }
  }, [deleteInvestment]);

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

  if (error && funds.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-title-s text-foreground">
          Mutual Funds
        </h3>
        <div className="p-3 rounded-xl border border-dashed border-border">
          <div className="text-center py-1">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Failed to load mutual fund data
            </p>
            <button
              onClick={refresh}
              className="text-xs font-bold text-foreground"
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
        <h3 className="text-title-s text-foreground">
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
            className="h-6 w-6 flex items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors disabled:opacity-50"
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
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-card">
        {/* Summary Header */}
        <button
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left transition-colors"
        >
          <span className="text-sm font-bold font-mono text-foreground">
            ₹
            {(userStats?.mutual_funds || 0).toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </span>

          <div className="h-5 w-5 rounded-lg flex items-center justify-center border border-border bg-muted">
            <ChevronDown
              className={`h-3 w-3 text-foreground transition-transform ${isCardExpanded ? "rotate-180" : ""
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
                <div className="h-px bg-border mb-2" />

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
