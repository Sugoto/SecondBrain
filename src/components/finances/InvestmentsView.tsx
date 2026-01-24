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

// Iron vault divider component
function OrnateDivider() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {/* Left iron bar */}
      <div
        className="h-0.5 flex-1 max-w-20 rounded-full"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent, #52525b)"
            : "linear-gradient(90deg, transparent, #6b7280)",
        }}
      />
      {/* Center iron bolt */}
      <div
        className="h-3 w-3 rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 30%, #71717a 0%, #3f3f46 60%, #27272a 100%)"
            : "radial-gradient(circle at 30% 30%, #d1d5db 0%, #6b7280 60%, #374151 100%)",
          boxShadow: isDark
            ? "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.5)"
            : "inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)",
          border: isDark ? "1px solid #52525b" : "1px solid #4b5563",
        }}
      />
      {/* Right iron bar */}
      <div
        className="h-0.5 flex-1 max-w-20 rounded-full"
        style={{
          background: isDark
            ? "linear-gradient(90deg, #52525b, transparent)"
            : "linear-gradient(90deg, #6b7280, transparent)",
        }}
      />
    </div>
  );
}

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
    <div className="pb-4">
      <NetWorthCard
        netWorth={netWorth}
        theme={theme}
        onEdit={() => setEditDialogOpen(true)}
      />

      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-6">
        <WealthDistributionChart userStats={userStats} theme={theme} mutualFundsValue={mfPortfolioValue} />
        
        <MutualFundWatchlist theme={theme} />
        
        <OrnateDivider />
        
        <FixedDepositsSection userStats={userStats} theme={theme} />
        
        <OrnateDivider />
        
        <ProvidentFundSection userStats={userStats} theme={theme} />
        
        <Footer />
      </div>
    </div>
  );
}
