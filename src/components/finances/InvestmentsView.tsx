import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useMutualFundWatchlist, calculateMFPortfolioTotals } from "@/hooks/useMutualFunds";
import { Footer } from "./Footer";
import { NetWorthCard, NetWorthEditDialog } from "./NetWorthCard";
import { WealthDistributionChart } from "./WealthDistributionChart";
import { MutualFundWatchlist } from "./MutualFundWatchlist";
import { FixedDepositsSection } from "./FixedDepositsSection";
import { ProvidentFundSection } from "./ProvidentFundSection";
import { calculateNetWorth } from "./utils";

export function InvestmentsView() {
  const { theme } = useTheme();
  const { userStats, updateUserStats } = useUserStats();
  const { funds } = useMutualFundWatchlist();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Calculate real-time MF portfolio value from units × current NAV
  const mfPortfolioValue = useMemo(() => {
    const investments = userStats?.investments || [];
    if (funds.length === 0 || investments.length === 0) return undefined;
    const totals = calculateMFPortfolioTotals(funds, investments);
    return totals.current;
  }, [funds, userStats?.investments]);

  // Net worth using real-time MF and FD values
  const netWorth = useMemo(
    () => calculateNetWorth(userStats, { mutualFundsValue: mfPortfolioValue }),
    [userStats, mfPortfolioValue]
  );

  return (
    <div className="pb-3 pt-3 px-3">
      <NetWorthCard
        netWorth={netWorth}
        onEdit={() => setEditDialogOpen(true)}
      />

      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      <div className="max-w-6xl mx-auto pt-3 flex flex-col gap-3">
        <WealthDistributionChart userStats={userStats} theme={theme} mutualFundsValue={mfPortfolioValue} />

        <MutualFundWatchlist theme={theme} />

        <FixedDepositsSection userStats={userStats} />

        <ProvidentFundSection userStats={userStats} theme={theme} />

        <Footer />
      </div>
    </div>
  );
}
