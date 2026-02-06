import { useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import { useMutualFundWatchlist, calculateMFPortfolioTotals } from "@/hooks/useMutualFunds";
import { DailyGoals } from "@/components/home/BountyBoard";
import { NetWorthCard, NetWorthEditDialog } from "@/components/finances/NetWorthCard";
import { NutritionCard } from "@/components/fitness/NutritionCard";
import { HealthStatsEditDialog } from "@/components/fitness/HealthStatsCard";
import { calculateNetWorth } from "@/components/finances/utils";

export function HomePage() {
  const { theme, toggle } = useTheme();
  const { userStats, updateUserStats } = useUserStats();
  const { userStats: healthStats, updateInCache: updateHealthStats } = useHealthData();
  const { funds } = useMutualFundWatchlist();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);

  // Calculate real-time MF portfolio value
  const mfPortfolioValue = useMemo(() => {
    const investments = userStats?.investments || [];
    if (funds.length === 0 || investments.length === 0) return undefined;
    const totals = calculateMFPortfolioTotals(funds, investments);
    return totals.current;
  }, [funds, userStats?.investments]);

  // Net worth calculation
  const netWorth = useMemo(
    () => calculateNetWorth(userStats, { mutualFundsValue: mfPortfolioValue }),
    [userStats, mfPortfolioValue]
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Neo-brutalism style */}
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Hi Sugoto!
        </h1>
        <button
          onClick={toggle}
          className="h-10 w-10 rounded-lg flex items-center justify-center neo-brutal-sm bg-pastel-yellow"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-black dark:text-white" />
          ) : (
            <Moon className="h-5 w-5 text-black dark:text-white" />
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 pb-28">
        {/* Net Worth Widget */}
        <div className="mb-8">
          <NetWorthCard
            netWorth={netWorth}
            onEdit={() => setEditDialogOpen(true)}
          />
        </div>

        {/* Nutrition Card */}
        <div className="mb-8">
          <NutritionCard onEdit={() => setHealthDialogOpen(true)} />
        </div>

        {/* Daily Goals */}
        <DailyGoals />
      </main>

      {/* Net Worth Edit Dialog */}
      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      {/* Health Stats Edit Dialog */}
      <HealthStatsEditDialog
        open={healthDialogOpen}
        onOpenChange={setHealthDialogOpen}
        userStats={healthStats ?? null}
        onUpdate={updateHealthStats}
      />
    </div>
  );
}
