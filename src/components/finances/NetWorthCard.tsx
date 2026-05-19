import { useFormatCurrency } from "@/hooks/usePrivacy";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface NetWorthCardProps {
  netWorth: number;
  monthlyIncome: number | null;
}

export function NetWorthCard({ netWorth, monthlyIncome }: NetWorthCardProps) {
  const dailySalary = monthlyIncome ? Math.round(monthlyIncome / 22) : null;
  const fmt = useFormatCurrency();

  return (
    <section className="px-6 pt-6 pb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Net Worth
        </span>
        {dailySalary && (
          <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
            <span className="text-success">+</span>
            {fmt(dailySalary)}
            <span className="text-muted-foreground/60"> / day</span>
          </span>
        )}
      </div>
      <p className="font-mono tabular-nums tracking-[-0.04em] text-foreground leading-[0.9] text-[clamp(44px,13vw,64px)]">
        <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
      </p>
    </section>
  );
}
