import { useMemo } from "react";
import { User } from "lucide-react";
import { useAssetCurrency } from "@/hooks/usePrivacy";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateNetWorth } from "@/components/finances/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { NutritionCard } from "@/components/fitness/NutritionCard";
import { Notes } from "@/components/home/Notes";
import { useWorkouts } from "@/hooks/useWorkouts";

const SCHEDULE: Record<number, { label: string; session: "push" | "pull" | "legs" }> = {
  1: { label: "Monday", session: "push" },
  2: { label: "Tuesday", session: "pull" },
  3: { label: "Wednesday", session: "legs" },
  4: { label: "Thursday", session: "push" },
  5: { label: "Friday", session: "pull" },
};

function TodayWorkout() {
  const { workouts } = useWorkouts();
  const jsDay = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  ).getDay();
  const today = SCHEDULE[jsDay];

  if (!today) {
    return (
      <section className="px-6 pt-6 pb-6 border-t border-zinc-300 dark:border-zinc-700">
        <p className="text-[13px] text-muted-foreground/60">Take a rest today.</p>
      </section>
    );
  }

  const exercises = workouts.filter((w) => w.session === today.session);

  return (
    <section className="px-6 pt-6 pb-6 border-t border-zinc-300 dark:border-zinc-700">
      <p className={`text-[10px] uppercase tracking-wider text-muted-foreground mb-3`}>
        Today — {today.session.charAt(0).toUpperCase() + today.session.slice(1)}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {exercises.map((ex) => (
          <p key={ex.id} className="text-[13px] text-foreground/80">{ex.name}</p>
        ))}
      </div>
    </section>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const EYEBROW = "text-[10px] uppercase tracking-wider text-muted-foreground";

export function HomePage() {
  const { navigateToSection } = useAppNavigation();
  const { session } = useAuth();
  const fmt = useAssetCurrency();
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

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      <header className="px-6 pt-8 pb-4">
        <p className={`${EYEBROW} mb-1.5`}>{getGreeting()}</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-[32px] leading-[1.1] tracking-[-0.03em] text-foreground min-w-0 truncate">
            {firstName}
          </h1>
          <button
            onClick={() => navigateToSection("profile")}
            aria-label="Open profile"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <section aria-labelledby="nw-label" className="px-6 pt-7 pb-8">
          <div className="flex items-center justify-between mb-4">
            <span id="nw-label" className={EYEBROW}>
              Net Worth
            </span>
            {dailySalary && (
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                <span className="text-success">+</span>
                {fmt(dailySalary)}
                <span className="text-muted-foreground/60"> / day</span>
              </span>
            )}
          </div>
          <div className="font-mono tabular-nums tracking-[-0.04em] text-foreground leading-[0.9] text-[clamp(36px,11vw,52px)]">
            <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
          </div>
        </section>

        <div className="border-t border-zinc-300 dark:border-zinc-700">
          <NutritionCard />
        </div>

        <TodayWorkout />

        <section className="px-6 pt-6 border-t border-zinc-300 dark:border-zinc-700">
          <Notes />
        </section>
      </main>
    </div>
  );
}
