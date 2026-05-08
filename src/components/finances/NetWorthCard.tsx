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
    <div className="w-full rounded-2xl bg-primary-container px-5 py-4">
      <p className="text-label-m mb-1">Net Worth</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-headline-s font-mono">
          <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
        </p>
        {dailySalary && (
          <span className="text-label-s font-mono px-2 py-0.5 rounded-full bg-on-primary-container/10">
            +{fmt(dailySalary)}/d
          </span>
        )}
      </div>
    </div>
  );
}
