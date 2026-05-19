import { useMemo } from "react";
import { User } from "lucide-react";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateNetWorth } from "@/components/finances/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { NutritionCard } from "@/components/fitness/NutritionCard";
import { Notes } from "@/components/home/Notes";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const EYEBROW = "text-[10px] uppercase tracking-[0.22em] text-muted-foreground";

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

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      <header className="flex items-end justify-between px-6 pt-8 pb-2">
        <div>
          <p className={`${EYEBROW} mb-2`}>{getGreeting()}</p>
          <h1 className="font-heading text-[40px] leading-[0.95] tracking-[-0.03em] text-foreground">
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => navigateToSection("profile")}
          aria-label="Open profile"
          className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <User className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <section aria-labelledby="nw-label" className="px-6 pt-10 pb-12">
          <div className="flex items-center justify-between mb-5">
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
          <div className="font-mono tabular-nums tracking-[-0.04em] text-foreground leading-[0.9] text-[clamp(44px,13vw,64px)]">
            <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
          </div>
        </section>

        <div className="border-t border-zinc-300 dark:border-zinc-700">
          <NutritionCard />
        </div>

        <section className="px-6 pt-8 border-t border-zinc-300 dark:border-zinc-700">
          <Notes />
        </section>
      </main>
    </div>
  );
}
