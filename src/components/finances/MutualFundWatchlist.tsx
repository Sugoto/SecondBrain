import { useState, memo } from "react";
import { useMutualFundWatchlist, type FundWithStats } from "@/hooks/useMutualFunds";
import { useUserStats } from "@/hooks/useExpenseData";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useMaskedAssetRupee, usePrivacy } from "@/hooks/usePrivacy";

const trend = (value: number) => (value >= 0 ? "text-[var(--ui-gain)]" : "text-[var(--ui-danger)]");

const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;

const FundRow = memo(function FundRow({
  fund,
  isExpanded,
  onToggle,
}: {
  fund: FundWithStats;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
        <span className={`ui-num shrink-0 text-[13px] ${trend(fund.dailyChangePercent)}`}>
          {signed(fund.dailyChangePercent)}
        </span>
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
              <dl className="ui-inset mt-2.5 grid grid-cols-4 px-3 py-2.5">
                {[
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
});

function TotalInput() {
  const { userStats, setMutualFunds } = useUserStats();
  const { hidden } = usePrivacy();
  const rupee = useMaskedAssetRupee();
  const saved = userStats?.mutual_funds ?? 0;
  const [draft, setDraft] = useState<string | null>(null);

  if (hidden || !userStats) {
    return (
      <p className="ui-num text-[34px] leading-tight font-medium tracking-[-0.02em] text-[var(--ui-ink)]">
        {rupee(saved, { maximumFractionDigits: 0 })}
      </p>
    );
  }

  const commit = () => {
    if (draft === null) return;
    const value = Math.round(Number(draft) || 0);
    setDraft(null);
    if (value !== saved) setMutualFunds(value).catch(console.error);
  };

  return (
    <label className="flex items-baseline gap-1">
      <span className="ui-num text-[20px] leading-none text-[var(--ui-ink-softer)]">₹</span>
      <span className="sr-only">Total in Indian mutual funds</span>
      <input
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="0"
        value={draft ?? (saved ? saved.toLocaleString("en-IN") : "")}
        onFocus={(e) => {
          setDraft(saved ? String(saved) : "");
          setTimeout(() => e.target.select(), 0);
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        className="ui-num min-w-0 flex-1 rounded-[8px] bg-transparent text-[34px] leading-tight font-medium tracking-[-0.02em] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)] focus:bg-[var(--ui-inset)]"
      />
    </label>
  );
}

export function MutualFundWatchlist() {
  const { funds, error, isRefetching, refresh, lastUpdated } = useMutualFundWatchlist();
  const [expanded, setExpanded] = useState<number | null>(null);

  const updated = lastUpdated?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="ui-panel px-5 pt-5 pb-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Indian MFs</h2>
        <div className="-mr-2.5 flex items-center">
          {updated && (
            <span className="ui-num text-[11px] text-[var(--ui-ink-softer)]">{updated}</span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={isRefetching}
            aria-label="Refresh fund changes"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-ink-softer)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ui-accent)] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      <div className="-mt-1">
        <TotalInput />
      </div>

      {error && funds.length === 0 ? (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--ui-rule)] py-3">
          <p className="text-[13px] text-[var(--ui-ink-soft)]">Couldn't load fund changes.</p>
          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-[10px] px-3 text-[13px] font-medium text-[var(--ui-ink)] transition-colors hover:bg-[var(--ui-inset)]"
          >
            Try again
          </button>
        </div>
      ) : funds.length > 0 ? (
        <ul className="mt-3 divide-y divide-[var(--ui-rule)] border-t border-[var(--ui-rule)]">
          {funds.map((fund) => (
            <FundRow
              key={fund.schemeCode}
              fund={fund}
              isExpanded={expanded === fund.schemeCode}
              onToggle={() =>
                setExpanded((current) => (current === fund.schemeCode ? null : fund.schemeCode))
              }
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-[var(--ui-rule)] py-4 text-[13px] text-[var(--ui-ink-softer)]">
          No funds on the watchlist yet.
        </p>
      )}
    </section>
  );
}
