import { useMemo, useState } from "react";
import {
  Moon,
  Sun,
  Eye,
  EyeOff,
  ChevronRight,
  Droplet,
  GlassWater,
  Beef,
  Wheat,
  Leaf,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { usePrivacy, useFormatCurrency } from "@/hooks/usePrivacy";
import { useUserStats } from "@/hooks/useExpenseData";
import { useHealthData } from "@/hooks/useHealthData";
import { NetWorthEditDialog } from "@/components/finances/NetWorthCard";
import { HealthStatsEditDialog } from "@/components/fitness/HealthStatsCard";
import { calculateNetWorth } from "@/components/finances/utils";
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
  const { hidden, toggle: togglePrivacy } = usePrivacy();
  const fmt = useFormatCurrency();
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

  const waterLiters = 3;
  const hasHealthData =
    healthStats?.height_cm &&
    healthStats?.weight_kg &&
    healthStats?.age &&
    healthStats?.gender;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="text-label-m text-muted-foreground">
            {getGreeting()}
          </p>
          <h1 className="text-headline-s text-foreground">
            Sugoto
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePrivacy}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            aria-pressed={hidden}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-surface-container transition-colors active:scale-95"
          >
            {hidden ? (
              <Eye className="h-5 w-5 text-foreground" />
            ) : (
              <EyeOff className="h-5 w-5 text-foreground" />
            )}
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-11 w-11 rounded-full flex items-center justify-center bg-surface-container transition-colors active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-28">
        <button
          onClick={() => setEditDialogOpen(true)}
          className="w-full text-left bg-primary-container rounded-2xl px-5 py-4 mb-2.5 transition-colors active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-label-m">Net Worth</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-headline-s font-mono tracking-tight">
              <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
            </span>
            {dailySalary && (
              <span className="text-label-s px-2 py-0.5 rounded-full bg-on-primary-container/10">
                +{fmt(dailySalary)}/d
              </span>
            )}
          </div>
        </button>

        {hasHealthData && tdee && (
          <button
            onClick={() => setHealthDialogOpen(true)}
            className="w-full text-left bg-card border border-outline-variant rounded-2xl px-5 py-4 mb-2.5 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-title-l font-mono text-foreground">
                  {formatNumber(tdee.targetCalories)}
                </span>
                <span className="text-label-m text-muted-foreground">kcal</span>
                <span className="text-label-s font-mono text-muted-foreground line-through">
                  {formatNumber(tdee.tdee)}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { icon: Beef, value: `${tdee.protein}g`, label: "Protein" },
                { icon: Wheat, value: `${tdee.carbs}g`, label: "Carbs" },
                { icon: Droplet, value: `${tdee.fat}g`, label: "Fat" },
                { icon: Leaf, value: "30g", label: "Fibre" },
                { icon: GlassWater, value: `${waterLiters}L`, label: "Water" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-surface-container">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-label-m font-mono text-foreground">{value}</p>
                  <p className="text-label-s text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </button>
        )}

        <DailyGoals />
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
