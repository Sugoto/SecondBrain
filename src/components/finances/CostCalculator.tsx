import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "./constants";

type PeriodMode = "months" | "years";

interface CostCalculatorProps {
  dailySalary: number;
}

export function CostCalculator({ dailySalary }: CostCalculatorProps) {
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
    const days = Math.floor(totalHours / 8);
    const remainingHours = totalHours % 8;
    if (remainingHours === 0) return `${days}d`;
    return `${days}d ${remainingHours}h`;
  };

  const periodLabel = periodMode === "months"
    ? `${sliderValue} ${sliderValue === 1 ? "month" : "months"}`
    : `${sliderValue} ${sliderValue === 1 ? "year" : "years"}`;

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Cost Calculator
      </h3>
      <div className="rounded-xl border border-border bg-card p-3">

      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Item cost"
        value={cost}
        onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
        className="font-mono h-8 text-xs font-bold border border-border rounded-lg bg-muted mb-3"
      />

      {/* Period mode tabs */}
      <div className="flex rounded-lg overflow-hidden border border-border text-[10px] mb-2">
        {(["months", "years"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => { setPeriodMode(mode); setSliderValue(1); }}
            className={`flex-1 px-2 py-1.5 font-bold transition-colors capitalize ${
              periodMode === mode
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-muted"
            } ${mode === "years" ? "border-l border-border" : ""}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Spread over</span>
          <span className="text-xs font-bold font-mono text-foreground">{periodLabel}</span>
        </div>
        <input
          type="range"
          min={1}
          max={periodMode === "months" ? 12 : 10}
          step={1}
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-foreground bg-muted border border-border"
        />
        <div className="flex justify-between text-[8px] text-muted-foreground font-mono mt-0.5">
          {Array.from({ length: periodMode === "months" ? 12 : 10 }, (_, i) => (
            <span key={i + 1}>{i + 1}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted border border-border">
          <p className="text-sm font-bold font-mono text-foreground">{result ? formatCurrency(result.perDay) : "₹0"}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">per day</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted border border-border">
          <p className="text-sm font-bold font-mono text-foreground">{result ? formatWorkTime(result.workHoursToEarn) : "0h"}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">work time</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted border border-border">
          <p className="text-sm font-bold font-mono text-foreground">{result ? `${result.pctOfDaily.toFixed(1)}%` : "0%"}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">of daily pay</p>
        </div>
      </div>
    </div>
    </div>
  );
}
