import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
    const days = Math.floor(totalHours / 8);
    const remainingHours = totalHours % 8;
    if (remainingHours === 0) return `${days}d`;
    return `${days}d ${remainingHours}h`;
  };

  const sliderMax = periodMode === "months" ? 12 : 10;
  const periodLabel = periodMode === "months"
    ? `${sliderValue} ${sliderValue === 1 ? "month" : "months"}`
    : `${sliderValue} ${sliderValue === 1 ? "year" : "years"}`;

  return (
    <div className="space-y-2">
      <h3 className="text-title-s text-foreground">Cost Calculator</h3>

      <div className="rounded-2xl border border-outline-variant bg-card p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-label-m text-muted-foreground">Item cost</label>
          <div className="flex items-baseline gap-2 bg-surface-container rounded-xl px-4 py-3">
            <span className="font-mono text-title-l text-muted-foreground">₹</span>
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 font-mono text-title-l text-foreground bg-transparent border-0 px-0 h-auto py-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label-m text-muted-foreground">Spread over</span>
            <span className="font-mono text-label-l text-foreground">{periodLabel}</span>
          </div>

          <div className="flex bg-surface-container rounded-full p-0.5">
            {(["months", "years"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setPeriodMode(mode); setSliderValue(1); }}
                className={`flex-1 rounded-full py-1 text-label-m capitalize transition-colors ${
                  periodMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
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
            className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-surface-container"
          />
          <div className="flex justify-between font-mono text-label-s text-muted-foreground px-0.5">
            <span>1</span>
            <span>{sliderMax}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant">
          <div>
            <p className="text-label-s text-muted-foreground">Per day</p>
            <p className="font-mono text-title-s text-foreground mt-0.5">
              {result ? fmt(result.perDay) : "—"}
            </p>
          </div>
          <div>
            <p className="text-label-s text-muted-foreground">Work time</p>
            <p className="font-mono text-title-s text-foreground mt-0.5">
              {result ? formatWorkTime(result.workHoursToEarn) : "—"}
            </p>
          </div>
          <div>
            <p className="text-label-s text-muted-foreground">Of daily pay</p>
            <p className="font-mono text-title-s text-foreground mt-0.5">
              {result ? `${result.pctOfDaily.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
