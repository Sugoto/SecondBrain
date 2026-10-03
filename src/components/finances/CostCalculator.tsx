import { useState, useMemo } from "react";
import { useFormatCurrency } from "@/hooks/usePrivacy";

type PeriodMode = "months" | "years";

interface CostCalculatorProps {
  dailySalary: number;
}

export function CostCalculator({ dailySalary }: CostCalculatorProps) {
  const fmt = useFormatCurrency();
  const [cost, setCost] = useState("");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("years");
  const [sliderValue, setSliderValue] = useState(1);

  const amount = parseFloat(cost) || 0;
  const days = periodMode === "months" ? sliderValue * 30 : sliderValue * 365;

  const result = useMemo(() => {
    if (amount <= 0 || dailySalary <= 0) return null;
    const perDay = amount / days;
    const workHoursToEarn = (amount / dailySalary) * 8;
    const pctOfDaily = (perDay / dailySalary) * 100;
    return { perDay, workHoursToEarn, pctOfDaily };
  }, [amount, days, dailySalary]);

  const formatWorkTime = (hours: number) => {
    if (hours < 1) return "1h";
    const totalHours = Math.round(hours);
    if (totalHours < 24) return `${totalHours}h`;
    const d = Math.floor(totalHours / 8);
    const remainingHours = totalHours % 8;
    if (remainingHours === 0) return `${d}d`;
    return `${d}d ${remainingHours}h`;
  };

  const sliderMax = periodMode === "months" ? 12 : 10;
  const periodLabel =
    periodMode === "months"
      ? `${sliderValue} ${sliderValue === 1 ? "month" : "months"}`
      : `${sliderValue} ${sliderValue === 1 ? "year" : "years"}`;

  const cells = [
    { label: "Per day", value: result ? fmt(result.perDay) : "–" },
    { label: "Work time", value: result ? formatWorkTime(result.workHoursToEarn) : "–" },
    { label: "Of daily pay", value: result ? `${result.pctOfDaily.toFixed(1)}%` : "–" },
  ];

  return (
    <section className="ui-panel px-5 pt-5 pb-5">
      <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">What it really costs</h2>

      <label className="ui-inset mt-3 flex items-baseline gap-1.5 px-4 py-3 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]">
        <span className="ui-num text-[20px] leading-none text-[var(--ui-ink-softer)]">₹</span>
        <span className="sr-only">Price</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={cost}
          onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
          className="ui-num min-w-0 flex-1 bg-transparent text-[32px] leading-none font-medium tracking-[-0.02em] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)]"
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[13px] text-[var(--ui-ink-soft)]">
          Spread over <span className="ui-num text-[var(--ui-ink)]">{periodLabel}</span>
        </span>
        <div role="group" aria-label="Period" className="ui-inset grid grid-cols-2 gap-1 p-1">
          {(["months", "years"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={periodMode === mode}
              onClick={() => {
                setPeriodMode(mode);
                setSliderValue(1);
              }}
              className={`h-8 rounded-[7px] px-3 text-[13px] capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)] ${
                periodMode === mode
                  ? "bg-[var(--ui-panel)] font-medium text-[var(--ui-accent)] shadow-[var(--ui-lift)]"
                  : "text-[var(--ui-ink-softer)] hover:text-[var(--ui-ink)]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        aria-label={`Number of ${periodMode}`}
        min={1}
        max={sliderMax}
        step={1}
        value={sliderValue}
        onChange={(e) => setSliderValue(parseInt(e.target.value))}
        className="mt-3 h-11 w-full cursor-pointer accent-[var(--ui-ink)]"
      />

      <dl className="ui-inset mt-2 grid grid-cols-3 px-4 py-3">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1.5">
            <dt className="text-[11px] leading-none text-[var(--ui-ink-softer)]">{cell.label}</dt>
            <dd className="ui-num text-[15px] leading-none font-medium text-[var(--ui-ink)]">
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
