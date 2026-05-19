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

  return (
    <section className="px-6 pt-7 pb-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-5">
        Cost Calculator
      </p>

      <div className="flex items-baseline gap-2 mb-6 border-b border-outline-variant/60 pb-4">
        <span className="font-mono text-muted-foreground text-[28px] leading-none">₹</span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={cost}
          onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
          className="flex-1 font-mono tabular-nums text-[40px] leading-none tracking-[-0.03em] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Spread over
        </span>
        <span className="font-mono tabular-nums text-[13px] text-foreground">
          {periodLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 border-y border-outline-variant divide-x divide-outline-variant mb-5">
        {(["months", "years"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setPeriodMode(mode);
              setSliderValue(1);
            }}
            className={`h-9 text-[10px] uppercase tracking-wider transition-colors ${
              periodMode === mode
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <input
        type="range"
        min={1}
        max={sliderMax}
        step={1}
        value={sliderValue}
        onChange={(e) => setSliderValue(parseInt(e.target.value))}
        className="w-full h-[2px] rounded-full appearance-none cursor-pointer accent-foreground bg-outline-variant"
      />
      <div className="flex justify-between font-mono tabular-nums text-[10px] text-muted-foreground/70 mt-2 mb-6">
        <span>1</span>
        <span>{sliderMax}</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-outline-variant/60 border-t border-outline-variant/60 pt-4">
        {[
          { label: "Per day", value: result ? fmt(result.perDay) : "—" },
          { label: "Work time", value: result ? formatWorkTime(result.workHoursToEarn) : "—" },
          { label: "Of daily pay", value: result ? `${result.pctOfDaily.toFixed(1)}%` : "—" },
        ].map((cell, i) => (
          <div key={cell.label} className={`flex flex-col gap-1 ${i === 0 ? "pr-3" : i === 1 ? "px-3" : "pl-3"}`}>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {cell.label}
            </span>
            <span className="font-mono tabular-nums text-[15px] text-foreground">
              {cell.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
