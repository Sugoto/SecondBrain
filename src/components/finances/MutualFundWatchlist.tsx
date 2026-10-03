import { useState, memo, useMemo, useCallback } from "react";
import {
  useMutualFundWatchlist,
  fetchNavForDate,
  type FundWithStats,
} from "@/hooks/useMutualFunds";
import { useUserStats } from "@/hooks/useExpenseData";
import type { Investment } from "@/lib/supabase";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, ChevronDown, Plus, Trash2, Loader2 } from "lucide-react";
import { useMaskedAssetRupee } from "@/hooks/usePrivacy";

interface FundSectionProps {
  fund: FundWithStats;
  isExpanded: boolean;
  onToggle: () => void;
  investments: Investment[];
  onAddInvestment: (amount: number, date: string) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
}

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
  const rupee = useMaskedAssetRupee();

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
    } finally {
      setAdding(false);
    }
  };

  const trend = (value: number) =>
    value >= 0 ? "text-[var(--ui-gain)]" : "text-[var(--ui-danger)]";
  const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex h-12 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ui-accent)]"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--ui-ink)]">
          {fund.shortName}
        </span>
        <span className={`ui-num shrink-0 text-[12px] ${trend(fund.dailyChangePercent)}`}>
          {signed(fund.dailyChangePercent)}
        </span>
        {hasInvestments && (
          <span className="ui-num w-24 shrink-0 text-right text-[14px] text-[var(--ui-ink)]">
            {rupee(currentValue, { maximumFractionDigits: 0 })}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--ui-ink-softer)] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
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
            <div className="pb-4">
              <p className="truncate text-[12px] text-[var(--ui-ink-softer)]">{fund.fullName}</p>

              <svg
                width="100%"
                height="28"
                aria-hidden
                className={`mt-3 ${isPositiveDay ? "text-[var(--ui-gain)]" : "text-[var(--ui-danger)]"}`}
                viewBox="0 0 100 28"
                preserveAspectRatio="none"
              >
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <dl className="ui-inset mt-3 grid grid-cols-5 px-3 py-2.5">
                {[
                  { label: "1D", value: fund.dailyChangePercent },
                  { label: "1M", value: fund.monthChangePercent },
                  { label: "1Y", value: fund.yearChangePercent },
                  { label: "3Y", value: fund.threeYearChangePercent },
                  { label: "5Y", value: fund.fiveYearChangePercent },
                ].map((p) => (
                  <div key={p.label} className="flex flex-col gap-1">
                    <dt className="text-[11px] leading-none text-[var(--ui-ink-softer)]">
                      {p.label}
                    </dt>
                    <dd className={`ui-num text-[12px] leading-none ${trend(p.value)}`}>
                      {signed(p.value)}
                    </dd>
                  </div>
                ))}
              </dl>

              {hasInvestments && (
                <ul className="mt-2 divide-y divide-[var(--ui-rule)]">
                  {investments.map((inv) => (
                    <li key={inv.id} className="flex h-11 items-center justify-between gap-3">
                      <span className="ui-num text-[14px] text-[var(--ui-ink)]">
                        {rupee(inv.amount)}
                      </span>
                      <span className="ui-num flex-1 text-[12px] text-[var(--ui-ink-softer)]">
                        {Temporal.PlainDate.from(inv.date).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteInvestment(inv.id)}
                        aria-label="Delete investment"
                        className="-mr-2.5 flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-ink-softer)] transition-colors hover:bg-[var(--ui-inset)] hover:text-[var(--ui-danger)] focus-visible:outline-2 focus-visible:outline-[var(--ui-danger)]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Amount invested"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="₹ Amount"
                  className="ui-inset ui-num h-11 min-w-0 flex-1 px-3 text-[14px] text-[var(--ui-ink)] outline-none transition-shadow placeholder:text-[var(--ui-ink-softer)] focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
                />
                <input
                  type="date"
                  aria-label="Date invested"
                  value={investDate}
                  onChange={(e) => setInvestDate(e.target.value)}
                  className="ui-inset ui-num h-11 w-36 px-3 text-[13px] text-[var(--ui-ink)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
                />
                <button
                  type="button"
                  onClick={handleInvest}
                  disabled={adding || !investAmount || !investDate}
                  aria-label="Add investment"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[var(--ui-edge)] text-[var(--ui-ink)] transition-colors hover:bg-[var(--ui-inset)] focus-visible:outline-2 focus-visible:outline-[var(--ui-accent)] disabled:opacity-40"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
});

export function MutualFundWatchlist() {
  const { funds, error, isRefetching, refresh, lastUpdated } = useMutualFundWatchlist();
  const { userStats, addInvestment, deleteInvestment } = useUserStats();
  const rupee = useMaskedAssetRupee();
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());

  const investments = useMemo(() => userStats?.investments || [], [userStats?.investments]);

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
      await deleteInvestment(id).catch(() => undefined);
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

  const updated = lastUpdated?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="ui-panel px-5 pt-5 pb-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Mutual funds</h2>
        <div className="-mr-2.5 flex items-center">
          {updated && (
            <span className="ui-num text-[11px] text-[var(--ui-ink-softer)]">{updated}</span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={isRefetching}
            aria-label="Refresh prices"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-ink-softer)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ui-accent)] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      <p className="ui-num -mt-1 text-[34px] leading-none font-medium tracking-[-0.02em] text-[var(--ui-ink)]">
        {rupee(userStats?.mutual_funds || 0, { maximumFractionDigits: 0 })}
      </p>

      {error && funds.length === 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--ui-rule)] py-3">
          <p className="text-[13px] text-[var(--ui-ink-soft)]">Couldn't load fund prices.</p>
          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-[10px] px-3 text-[13px] font-medium text-[var(--ui-ink)] transition-colors hover:bg-[var(--ui-inset)]"
          >
            Try again
          </button>
        </div>
      ) : funds.length > 0 ? (
        <ul className="mt-4 divide-y divide-[var(--ui-rule)] border-t border-[var(--ui-rule)]">
          {funds.map((fund) => (
            <FundSection
              key={fund.schemeCode}
              fund={fund}
              isExpanded={expandedFunds.has(fund.schemeCode)}
              onToggle={() => handleToggle(fund.schemeCode)}
              investments={getInvestmentsForFund(fund.schemeCode)}
              onAddInvestment={(amount, date) => handleAddInvestment(fund.schemeCode, amount, date)}
              onDeleteInvestment={handleDeleteInvestment}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-[var(--ui-rule)] py-4 text-[13px] text-[var(--ui-ink-softer)]">
          No funds on the watchlist yet.
        </p>
      )}
    </section>
  );
}
