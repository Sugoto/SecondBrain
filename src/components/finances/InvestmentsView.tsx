import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useAssetCurrency, usePrivacy } from "@/hooks/usePrivacy";
import type { UserStats } from "@/lib/supabase";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { MutualFundWatchlist } from "./MutualFundWatchlist";
import { CostCalculator } from "./CostCalculator";
import { SalaryChart } from "./SalaryChart";
import { calculateNetWorth } from "./utils";

const ASSETS = [
  { key: "bank_savings", label: "Bank savings" },
  { key: "mutual_funds", label: "Indian MFs" },
  { key: "us_etfs", label: "US ETFs" },
  { key: "ppf", label: "PPF" },
  { key: "epf", label: "EPF" },
] as const;

const SHADES = [100, 72, 50, 34, 22];

const shade = (i: number) =>
  `color-mix(in oklch, var(--ui-accent) ${SHADES[Math.min(i, SHADES.length - 1)]}%, var(--ui-inset))`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function NetWorth({ netWorth, monthlyIncome }: { netWorth: number; monthlyIncome: number | null }) {
  const fmt = useAssetCurrency();
  const dailySalary = monthlyIncome ? Math.round(monthlyIncome / 22) : null;
  const animate = !prefersReducedMotion();

  return (
    <section className="px-1 pt-2">
      <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Net worth</h2>
      <p className="ui-num mt-2 text-[clamp(38px,11.5vw,54px)] leading-none font-medium tracking-[-0.02em] text-[var(--ui-ink)]">
        {animate ? (
          <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
        ) : (
          <span>{fmt(netWorth)}</span>
        )}
      </p>
      {dailySalary && (
        <p className="mt-3 text-[13px] text-[var(--ui-ink-softer)]">
          Earning <span className="ui-num text-[var(--ui-ink-soft)]">{fmt(dailySalary)}</span> a
          working day
        </p>
      )}
    </section>
  );
}

function Allocation({ userStats }: { userStats: UserStats | null }) {
  const fmt = useAssetCurrency();

  const items = useMemo(() => {
    if (!userStats) return [];
    const rows = ASSETS.map(({ key, label }) => ({ label, value: userStats[key] || 0 }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map((row, i) => ({ ...row, share: row.value / total, color: shade(i) }));
  }, [userStats]);

  if (items.length === 0) return null;

  return (
    <section className="ui-panel px-5 pt-5 pb-2">
      <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Allocation</h2>

      <div
        role="img"
        aria-label={items.map((i) => `${i.label} ${Math.round(i.share * 100)}%`).join(", ")}
        className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full"
      >
        {items.map((item) => (
          <span
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${item.share * 100}%`, background: item.color }}
          />
        ))}
      </div>

      <ul className="mt-3 divide-y divide-[var(--ui-rule)]">
        {items.map((item) => (
          <li key={item.label} className="flex h-11 items-center gap-3">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--ui-ink)]">
              {item.label}
            </span>
            <span className="ui-num w-10 text-right text-[12px] text-[var(--ui-ink-softer)]">
              {Math.round(item.share * 100)}%
            </span>
            <span className="ui-num w-28 text-right text-[14px] text-[var(--ui-ink)]">
              {fmt(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InvestmentsView() {
  const { theme } = useTheme();
  const { userStats } = useUserStats();
  const { hidden } = usePrivacy();

  const netWorth = useMemo(() => calculateNetWorth(userStats), [userStats]);
  const dailySalary = userStats?.monthly_income ? userStats.monthly_income / 22 : 0;

  return (
    <div className="ui-type mx-auto max-w-6xl space-y-4 px-4 pt-2 pb-6">
      <NetWorth netWorth={netWorth} monthlyIncome={userStats?.monthly_income ?? null} />
      <div className="pt-4">
        <Allocation userStats={userStats} />
      </div>
      <MutualFundWatchlist />
      {!hidden && <SalaryChart theme={theme} />}
      {dailySalary > 0 && <CostCalculator dailySalary={dailySalary} />}
    </div>
  );
}
