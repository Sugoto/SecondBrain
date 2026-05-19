import { useState, memo, useMemo, useCallback } from "react";
import {
  useMutualFundWatchlist,
  fetchNavForDate,
  type FundWithStats,
} from "@/hooks/useMutualFunds";
import { useUserStats } from "@/hooks/useExpenseData";
import type { Investment } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCw,
  ChevronDown,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useMaskedRupee } from "@/hooks/usePrivacy";

interface FundSectionProps {
  fund: FundWithStats;
  isExpanded: boolean;
  onToggle: () => void;
  investments: Investment[];
  onAddInvestment: (amount: number, date: string) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
}

// million-ignore - SVG sparkline not compatible with Million.js
const FundSection = memo(function FundSection({
  fund,
  isExpanded,
  onToggle,
  investments,
  onAddInvestment,
  onDeleteInvestment,
}: FundSectionProps) {
  const [investAmount, setInvestAmount] = useState("");
  const [investDate, setInvestDate] = useState("");
  const [adding, setAdding] = useState(false);
  const rupee = useMaskedRupee();

  const investmentStats = useMemo(() => {
    const totalUnits = investments.reduce((sum, i) => sum + i.units, 0);
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const currentValue = totalUnits * fund.currentNav;
    const previousValue = totalUnits * fund.previousNav;
    const netChange = currentValue - totalInvested;
    const dailyChangeAmount = currentValue - previousValue;

    return {
      currentValue,
      hasInvestments: investments.length > 0,
      isNetUp: netChange >= 0,
      isPositiveDay: dailyChangeAmount >= 0,
    };
  }, [investments, fund.currentNav, fund.previousNav]);

  const { currentValue, hasInvestments, isPositiveDay } = investmentStats;

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
    if (!investAmount || !investDate) return;
    setAdding(true);
    try {
      await onAddInvestment(parseFloat(investAmount), investDate);
      setInvestAmount("");
      setInvestDate("");
    } catch {
      // handled in parent
    } finally {
      setAdding(false);
    }
  };

  const Trend = isPositiveDay ? TrendingUp : TrendingDown;

  return (
    <div className="border-b border-outline-variant/60 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-3 flex items-center gap-3 text-left"
      >
        <Trend
          className={`h-3.5 w-3.5 shrink-0 ${
            isPositiveDay ? "text-success" : "text-destructive"
          }`}
          strokeWidth={1.5}
        />
        <span className="text-[13px] text-foreground truncate flex-1">
          {fund.shortName}
        </span>
        {hasInvestments && (
          <span className="font-mono tabular-nums text-[13px] text-foreground shrink-0">
            {rupee(currentValue, { maximumFractionDigits: 0 })}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground/70 shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 pt-1">
              <p className="text-[11px] text-muted-foreground truncate mb-3">
                {fund.fullName}
              </p>

              <svg
                width="100%"
                height="24"
                className={`mb-4 ${isPositiveDay ? "text-success" : "text-destructive"}`}
                viewBox="0 0 100 28"
                preserveAspectRatio="none"
              >
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="grid grid-cols-5 divide-x divide-outline-variant/60 border-y border-outline-variant/60 mb-4">
                {[
                  { label: "1D", value: fund.dailyChangePercent },
                  { label: "1M", value: fund.monthChangePercent },
                  { label: "1Y", value: fund.yearChangePercent },
                  { label: "3Y", value: fund.threeYearChangePercent },
                  { label: "5Y", value: fund.fiveYearChangePercent },
                ].map((p) => (
                  <div key={p.label} className="flex flex-col items-start gap-1 px-2 py-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {p.label}
                    </span>
                    <span
                      className={`font-mono tabular-nums text-[12px] ${
                        p.value >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {p.value >= 0 ? "+" : ""}
                      {p.value.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {hasInvestments && (
                <div className="mb-3">
                  {investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 border-b border-outline-variant/40 last:border-b-0"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono tabular-nums text-[13px] text-foreground">
                          {rupee(inv.amount)}
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
                        aria-label="Delete investment"
                        className="text-muted-foreground/60 hover:text-destructive transition-colors active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/60">
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="₹ amount"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono tabular-nums text-[13px] bg-transparent outline-none flex-1 py-2 placeholder:text-muted-foreground/40"
                />
                <input
                  type="date"
                  value={investDate}
                  onChange={(e) => setInvestDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[12px] bg-transparent outline-none w-28 py-2 text-muted-foreground"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInvest();
                  }}
                  disabled={adding}
                  aria-label="Add investment"
                  className="h-8 w-8 flex items-center justify-center text-foreground hover:text-foreground transition-colors active:scale-95 disabled:opacity-40"
                >
                  {adding ? (
                    <span className="text-[10px]">…</span>
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export function MutualFundWatchlist() {
  const { funds, error, isRefetching, refresh, lastUpdated } =
    useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const rupee = useMaskedRupee();
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

  const investments = useMemo(
    () => userStats?.investments || [],
    [userStats?.investments],
  );

  const handleToggle = useCallback((schemeCode: number) => {
    setExpandedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeCode)) next.delete(schemeCode);
      else next.add(schemeCode);
      return next;
    });
  }, []);

  const handleAddInvestment = useCallback(
    async (schemeCode: number, amount: number, date: string) => {
      const nav = await fetchNavForDate(schemeCode, date);
      if (!nav) throw new Error("NAV not found");

      const units = amount / nav;
      await addInvestment({ schemeCode, amount, date, nav, units });
    },
    [addInvestment],
  );

  const handleDeleteInvestment = useCallback(
    async (id: string) => {
      try {
        await deleteInvestment(id);
      } catch {
        // ignore
      }
    },
    [deleteInvestment],
  );

  const investmentsByFund = useMemo(() => {
    const map = new Map<number, Investment[]>();
    for (const inv of investments) {
      const existing = map.get(inv.schemeCode) || [];
      existing.push(inv);
      map.set(inv.schemeCode, existing);
    }
    return map;
  }, [investments]);

  const getInvestmentsForFund = useCallback(
    (schemeCode: number) => investmentsByFund.get(schemeCode) || [],
    [investmentsByFund],
  );

  if (error && funds.length === 0) {
    return (
      <section className="px-6 pt-7 pb-8">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
          Mutual Funds
        </p>
        <p className="text-[13px] text-muted-foreground mb-3">
          Failed to load mutual fund data.
        </p>
        <button
          onClick={refresh}
          className="text-[11px] uppercase tracking-wider text-foreground hover:opacity-80 transition-opacity"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="px-6 pt-7 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Mutual Funds
        </p>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="font-mono tabular-nums text-[10px] text-muted-foreground/70">
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isRefetching}
            aria-label="Refresh"
            className="text-muted-foreground hover:text-foreground transition-colors active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsCardExpanded(!isCardExpanded)}
        className="w-full flex items-center justify-between text-left py-2"
      >
        <span className="font-mono tabular-nums text-[22px] tracking-[-0.02em] text-foreground">
          {rupee(userStats?.mutual_funds || 0, { maximumFractionDigits: 0 })}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isCardExpanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence initial={false}>
        {isCardExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-outline-variant/60 mt-3">
              {funds.length > 0 ? (
                funds.map((fund) => (
                  <FundSection
                    key={fund.schemeCode}
                    fund={fund}
                    isExpanded={expandedFunds.has(fund.schemeCode)}
                    onToggle={() => handleToggle(fund.schemeCode)}
                    investments={getInvestmentsForFund(fund.schemeCode)}
                    onAddInvestment={(amount, date) =>
                      handleAddInvestment(fund.schemeCode, amount, date)
                    }
                    onDeleteInvestment={handleDeleteInvestment}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-[13px] text-muted-foreground">
                  No funds in watchlist
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
