import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
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

  const netWorth = useMemo(
    () => calculateNetWorth(userStats),
    [userStats]
  );

  const dailySalary = userStats?.monthly_income ? userStats.monthly_income / 22 : 0;

  return (
    <div className="pb-3 pt-3 px-3">
      <NetWorthCard
        netWorth={netWorth}
        monthlyIncome={userStats?.monthly_income ?? null}
      />

      <div className="max-w-6xl mx-auto pt-3 flex flex-col gap-3">
        <SalaryChart theme={theme} />

        <WealthDistributionChart userStats={userStats} theme={theme} />

        <MutualFundWatchlist />

        <ProvidentFundSection userStats={userStats} theme={theme} />

        {dailySalary > 0 && <CostCalculator dailySalary={dailySalary} />}

        <Footer />
      </div>
    </div>
  );
}
