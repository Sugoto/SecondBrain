import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats, useExpenseData } from "@/hooks/useExpenseData";
import { Footer } from "./Footer";
import { NetWorthCard, NetWorthEditDialog } from "./NetWorthCard";
import { WealthDistributionChart } from "./WealthDistributionChart";
import { MutualFundWatchlist } from "./MutualFundWatchlist";
import { FixedDepositsSection } from "./FixedDepositsSection";
import { ProvidentFundSection } from "./ProvidentFundSection";
import { calculateNetWorth, calculateMonthlySavings, calculateTimeToGoal } from "./utils";

export function InvestmentsView() {
  const { theme } = useTheme();
  const { userStats, loading, updateUserStats } = useUserStats();
  const { transactions } = useExpenseData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const netWorth = useMemo(() => calculateNetWorth(userStats), [userStats]);
  
  const goalProgress = useMemo(() => {
    const { monthlySavings } = calculateMonthlySavings(
      transactions,
      userStats?.monthly_income ?? null
    );
    const timeToGoal = calculateTimeToGoal(netWorth, monthlySavings);
    return { monthlySavings, timeToGoal };
  }, [transactions, userStats?.monthly_income, netWorth]);

  return (
    <div className="pb-4">
      <NetWorthCard
        netWorth={netWorth}
        theme={theme}
        loading={loading}
        onEdit={() => setEditDialogOpen(true)}
        goalProgress={goalProgress}
      />

      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-6">
        <WealthDistributionChart userStats={userStats} theme={theme} />
        
        <MutualFundWatchlist theme={theme} />
        
        <div className="h-px bg-border mt-7" />
        
        <FixedDepositsSection userStats={userStats} theme={theme} />
        
        <div className="h-px bg-border" />
        
        <ProvidentFundSection userStats={userStats} theme={theme} />
        
        <Footer />
      </div>
    </div>
  );
}
