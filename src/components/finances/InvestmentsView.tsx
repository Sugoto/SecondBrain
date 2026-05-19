import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { usePrivacy } from "@/hooks/usePrivacy";
import { Footer } from "./Footer";
import { NetWorthCard } from "./NetWorthCard";
import { WealthDistributionChart } from "./WealthDistributionChart";
import { MutualFundWatchlist } from "./MutualFundWatchlist";
import { ProvidentFundSection } from "./ProvidentFundSection";
import { CostCalculator } from "./CostCalculator";
import { SalaryChart } from "./SalaryChart";
import { calculateNetWorth } from "./utils";

export function InvestmentsView() {
  const { theme } = useTheme();
  const { userStats } = useUserStats();
  const { hidden } = usePrivacy();

  const netWorth = useMemo(
    () => calculateNetWorth(userStats),
    [userStats]
  );

  const dailySalary = userStats?.monthly_income ? userStats.monthly_income / 22 : 0;

  const divider = "border-t border-zinc-300 dark:border-zinc-700";
  return (
    <div className="max-w-6xl mx-auto">
      <NetWorthCard
        netWorth={netWorth}
        monthlyIncome={userStats?.monthly_income ?? null}
      />
      {!hidden && (
        <div className={divider}>
          <SalaryChart theme={theme} />
        </div>
      )}
      <div className={divider}>
        <WealthDistributionChart userStats={userStats} theme={theme} />
      </div>
      <div className={divider}>
        <MutualFundWatchlist />
      </div>
      <div className={divider}>
        <ProvidentFundSection userStats={userStats} theme={theme} />
      </div>
      {dailySalary > 0 && (
        <div className={divider}>
          <CostCalculator dailySalary={dailySalary} />
        </div>
      )}
      <div className={divider}>
        <Footer />
      </div>
    </div>
  );
}
