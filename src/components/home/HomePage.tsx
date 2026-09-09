import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { useAssetCurrency } from "@/hooks/usePrivacy";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateNetWorth } from "@/components/finances/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { NutritionSummary } from "@/components/home/NutritionSummary";
import { Notes } from "@/components/home/Notes";
import { useWorkouts } from "@/hooks/useWorkouts";

const SCHEDULE: Record<number, { label: string; session: "push" | "pull" | "legs" }> = {
  1: { label: "Monday", session: "push" },
  2: { label: "Tuesday", session: "pull" },
  3: { label: "Wednesday", session: "legs" },
  4: { label: "Thursday", session: "push" },
  5: { label: "Friday", session: "pull" },
};

const SESSION_TITLE: Record<"push" | "pull" | "legs", string> = {
  push: "Push day",
  pull: "Pull day",
  legs: "Leg day",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TodayWorkout() {
  const { workouts } = useWorkouts();
  const jsDay = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay();
  const today = SCHEDULE[jsDay];

  if (!today) {
    return (
      <section className="ui-panel px-5 pt-5 pb-4">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Rest day</h2>
        <p className="mt-1.5 text-[13px] text-[var(--ui-ink-softer)]">
          Nothing scheduled. Eat well and sleep early.
        </p>
      </section>
    );
  }

  const exercises = workouts.filter((w) => w.session === today.session);

  return (
    <section className="ui-panel px-5 pt-5 pb-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">
          {SESSION_TITLE[today.session]}
        </h2>
        <span className="text-[11px] text-[var(--ui-ink-softer)]">{today.label}</span>
      </div>

      {exercises.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-[var(--ui-ink-softer)]">
          No exercises saved for this session yet.
        </p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex items-baseline justify-between gap-4">
              <span className="min-w-0 truncate text-[14px] text-[var(--ui-ink)]">{ex.name}</span>
              <span className="ui-num shrink-0 text-[13px] text-[var(--ui-ink-softer)]">
                {ex.max_weight}
                <span className="text-[var(--ui-ink-softer)]"> kg</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomePage() {
  const { navigateToSection } = useAppNavigation();
  const { session } = useAuth();
  const fmt = useAssetCurrency();
  const { userStats } = useUserStats();

  const firstName =
    (session?.user?.user_metadata?.given_name as string | undefined) ??
    (session?.user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "there";

  const netWorth = useMemo(() => calculateNetWorth(userStats), [userStats]);

  const dailySalary = userStats?.monthly_income ? Math.round(userStats.monthly_income / 22) : null;

  const animate = !prefersReducedMotion();

  const mainRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Collapse the plate once the content scrolls past the greeting; expand again
  // near the top. The gap between thresholds is hysteresis so a scroll that
  // hovers around the trigger point doesn't flicker the header open and shut.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = el.scrollTop;
        setCollapsed((prev) => (prev ? y > 24 : y > 64));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const motion = animate ? "transition-all duration-300 ease-out" : "";

  return (
    <div className="ui-surface relative flex h-full flex-col overflow-hidden">
      <header
        className={`ui-plate relative rounded-b-[22px] px-6 ${motion} ${
          collapsed ? "pt-4 pb-4" : "pt-7 pb-6"
        }`}
      >
        <button
          onClick={() => navigateToSection("profile")}
          aria-label="Open profile"
          className="absolute right-6 top-5 shrink-0 rounded-full border border-[var(--ui-plate-edge)] p-3 text-[var(--ui-plate-ink-soft)] transition-colors hover:text-[var(--ui-plate-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-plate-ink)] active:scale-95"
        >
          <User className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div
          className={`overflow-hidden pr-14 ${motion} ${
            collapsed ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
          }`}
        >
          <p className="text-[13px] text-[var(--ui-plate-ink-soft)]">{getGreeting()}</p>
          <h1 className="mt-0.5 truncate text-[30px] font-semibold leading-[1.15] tracking-[-0.02em]">
            {firstName}
          </h1>
        </div>

        <div className={`${motion} ${collapsed ? "mt-0" : "mt-7"}`}>
          <p className="text-[12px] text-[var(--ui-plate-ink-soft)]">Net worth</p>
          <div
            className={`ui-num mt-2 font-medium leading-none tracking-[-0.02em] ${motion} ${
              collapsed ? "text-[28px]" : "text-[clamp(38px,11.5vw,54px)]"
            }`}
          >
            {animate ? (
              <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
            ) : (
              <span>{fmt(netWorth)}</span>
            )}
          </div>
          {dailySalary && (
            <p
              className={`flex items-center gap-2 overflow-hidden text-[12px] text-[var(--ui-plate-ink-soft)] ${motion} ${
                collapsed ? "mt-0 max-h-0 opacity-0" : "mt-3.5 max-h-10 opacity-100"
              }`}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--ui-plate-accent)]" />
              <span>
                Earning{" "}
                <span className="ui-num text-[var(--ui-plate-ink)]">{fmt(dailySalary)}</span> a
                working day
              </span>
            </p>
          )}
        </div>
      </header>

      <main ref={mainRef} className="scroll-optimized flex-1 overflow-y-auto px-4 pt-5 pb-32">
        <NutritionSummary />
        <div className="py-7">
          <TodayWorkout />
        </div>
        <Notes />
      </main>
    </div>
  );
}
