import { useMemo, useState } from "react";
import {
  Moon,
  Sun,
  ChevronRight,
  Droplet,
  GlassWater,
  Beef,
  Wheat,
  Leaf,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import { NetWorthEditDialog } from "@/components/finances/NetWorthCard";
import { HealthStatsEditDialog } from "@/components/fitness/HealthStatsCard";
import { calculateNetWorth } from "@/components/finances/utils";
import { formatCurrency } from "@/components/finances/constants";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { calculateTDEE, formatNumber } from "@/components/fitness/utils";
import { DailyGoals } from "@/components/home/BountyBoard";

const MODERATE_MULTIPLIER = 1.55;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomePage() {
  const { theme, toggle } = useTheme();
  const { userStats, updateUserStats } = useUserStats();
  const { userStats: healthStats, updateInCache: updateHealthStats } = useHealthData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);

  const netWorth = useMemo(
    () => calculateNetWorth(userStats),
    [userStats]
  );

  const dailySalary = userStats?.monthly_income
    ? Math.round(userStats.monthly_income / 22)
    : null;

  const tdee = useMemo(() => {
    if (!healthStats) return null;
    return calculateTDEE(
      {
        height_cm: healthStats.height_cm,
        weight_kg: healthStats.weight_kg,
        age: healthStats.age,
        gender: healthStats.gender,
        activity_level: "moderate",
      },
      MODERATE_MULTIPLIER
    );
  }, [healthStats]);

  const waterLiters = healthStats?.weight_kg ? healthStats.weight_kg * 0.033 : 0;
  const hasHealthData =
    healthStats?.height_cm &&
    healthStats?.weight_kg &&
    healthStats?.age &&
    healthStats?.gender;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-1">
        <div>
          <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
            {getGreeting()}
          </p>
          <h1 className="text-xl font-bold tracking-tight vercel-gradient-text">
            Sugoto
          </h1>
        </div>
        <button
          onClick={toggle}
          className="h-9 w-9 rounded-full flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-white/10 hover:scale-105 active:scale-95"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          ) : (
            <Moon className="h-4 w-4 text-neutral-500" />
          )}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-28">
        {/* Net Worth Card */}
        <button
          onClick={() => setEditDialogOpen(true)}
          className="w-full text-left vercel-card vercel-glow px-5 py-4 group mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Net Worth
              </span>
            </div>
            <div className="h-5 w-5 rounded-full flex items-center justify-center bg-neutral-100/80 dark:bg-white/5 transition-all group-hover:bg-neutral-200/80 dark:group-hover:bg-white/10 group-hover:translate-x-0.5">
              <ChevronRight className="h-2.5 w-2.5 text-neutral-400 dark:text-neutral-500" />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tracking-tighter">
              <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
            </span>
            {dailySalary && (
              <span className="vercel-badge text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10">
                +{formatCurrency(dailySalary)}/d
              </span>
            )}
          </div>
        </button>

        {/* Nutrition Card */}
        {hasHealthData && tdee && (
          <button
            onClick={() => setHealthDialogOpen(true)}
            className="w-full text-left vercel-card vercel-glow px-5 py-4 mb-4 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter">
                  {formatNumber(tdee.targetCalories)}
                </span>
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  kcal
                </span>
                <span className="text-[10px] font-mono text-neutral-300 dark:text-neutral-600 line-through">
                  {formatNumber(tdee.tdee)}
                </span>
              </div>
              <div className="h-5 w-5 rounded-full flex items-center justify-center bg-neutral-100/80 dark:bg-white/5 transition-all group-hover:bg-neutral-200/80 dark:group-hover:bg-white/10 group-hover:translate-x-0.5">
                <ChevronRight className="h-2.5 w-2.5 text-neutral-400 dark:text-neutral-500" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { icon: Beef, value: `${tdee.protein}g`, label: "Protein", color: "text-rose-500 dark:text-rose-400" },
                { icon: Wheat, value: `${tdee.carbs}g`, label: "Carbs", color: "text-amber-500 dark:text-amber-400" },
                { icon: Droplet, value: `${tdee.fat}g`, label: "Fat", color: "text-sky-500 dark:text-sky-400" },
                { icon: Leaf, value: "30g", label: "Fibre", color: "text-green-500 dark:text-green-400" },
                { icon: GlassWater, value: `${waterLiters.toFixed(1)}L`, label: "Water", color: "text-cyan-500 dark:text-cyan-400" },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="vercel-stat flex flex-col items-center gap-1 py-2 px-1">
                  <Icon className={`h-3 w-3 ${color}`} />
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white tracking-tight">
                    {value}
                  </p>
                  <p className="text-[8px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </button>
        )}

        {/* Daily Goals */}
        <div>
          <DailyGoals />
        </div>
      </main>

      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      <HealthStatsEditDialog
        open={healthDialogOpen}
        onOpenChange={setHealthDialogOpen}
        userStats={healthStats ?? null}
        onUpdate={updateHealthStats}
      />
    </div>
  );
}
