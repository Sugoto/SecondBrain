import { useMemo } from "react";
import {
  Droplet,
  GlassWater,
  Beef,
  Wheat,
  Leaf,
  TrendingUp,
  User,
  Apple,
} from "lucide-react";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateNetWorth } from "@/components/finances/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { calculateTDEE, formatNumber } from "@/components/fitness/utils";
import { Notes } from "@/components/home/Notes";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomePage() {
  const { navigateToSection } = useAppNavigation();
  const { session } = useAuth();
  const fmt = useFormatCurrency();
  const { userStats } = useUserStats();

  const firstName =
    (session?.user?.user_metadata?.given_name as string | undefined) ??
    (session?.user?.user_metadata?.full_name as string | undefined)?.split(
      " ",
    )[0] ??
    "there";

  const netWorth = useMemo(
    () => calculateNetWorth(userStats),
    [userStats]
  );

  const dailySalary = userStats?.monthly_income
    ? Math.round(userStats.monthly_income / 22)
    : null;

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE({
      height_cm: userStats.height_cm,
      weight_kg: userStats.weight_kg,
      age: userStats.age,
      gender: userStats.gender,
      activity_level: userStats.activity_level,
      calorie_adjustment: userStats.calorie_adjustment,
    });
  }, [userStats]);

  const waterLiters = 3;
  const hasHealthData =
    userStats?.height_cm &&
    userStats?.weight_kg &&
    userStats?.age &&
    userStats?.gender;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="text-label-m text-muted-foreground">
            {getGreeting()}
          </p>
          <h1 className="text-headline-s text-foreground">
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => navigateToSection("profile")}
          aria-label="Open profile"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-surface-container transition-colors active:scale-95"
        >
          <User className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-28">
        <div className="w-full bg-primary-container rounded-2xl px-5 py-4 mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-label-m">Net Worth</span>
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
        </div>

        {hasHealthData && tdee && (
          <div className="w-full bg-card border border-outline-variant rounded-2xl px-5 py-4 mb-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Apple className="h-3.5 w-3.5 text-foreground" />
              <span className="text-label-m text-foreground">Nutrition</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-title-l font-mono text-foreground">
                {formatNumber(tdee.targetCalories)}
              </span>
              <span className="text-label-m text-muted-foreground">kcal</span>
              <span className="text-label-s font-mono text-muted-foreground line-through">
                {formatNumber(tdee.tdee)}
              </span>
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
          </div>
        )}

        <Notes />
      </main>
    </div>
  );
}
