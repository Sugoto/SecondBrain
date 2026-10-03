import { useLayoutEffect, useMemo, useRef } from "react";
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
import { TIME_ZONE, today } from "@/lib/utils";

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

const COLLAPSED_INSET = 16;
const COLLAPSED_AMOUNT = 28;

function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TodayWorkout() {
  const { workouts } = useWorkouts();
  const scheduled = SCHEDULE[today().dayOfWeek];

  if (!scheduled) {
    return (
      <section className="ui-panel px-5 pt-5 pb-4">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Rest day</h2>
        <p className="mt-1.5 text-[13px] text-[var(--ui-ink-softer)]">
          Nothing scheduled. Eat well and sleep early.
        </p>
      </section>
    );
  }

  const exercises = workouts.filter((w) => w.session === scheduled.session);

  return (
    <section className="ui-panel px-5 pt-5 pb-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">
          {SESSION_TITLE[scheduled.session]}
        </h2>
        <span className="text-[11px] text-[var(--ui-ink-softer)]">{scheduled.label}</span>
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
  const h = Temporal.Now.plainTimeISO(TIME_ZONE).hour;
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

  const surfaceRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLElement>(null);
  const worthRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const plate = plateRef.current;
    const worth = worthRef.current;
    const amount = amountRef.current;
    if (!surface || !plate || !worth || !amount) return;

    const measure = () => {
      const full = plate.offsetHeight;
      const shift = offsetWithin(worth, plate) - COLLAPSED_INSET;
      const fontSize = parseFloat(getComputedStyle(amount).fontSize) || COLLAPSED_AMOUNT;
      const scale = COLLAPSED_AMOUNT / fontSize;
      const collapsed =
        offsetWithin(amount, plate) - shift + amount.offsetHeight * scale + COLLAPSED_INSET;
      surface.style.setProperty("--plate-full", `${full}px`);
      surface.style.setProperty("--plate-shift", `${shift}px`);
      surface.style.setProperty("--amount-scale", `${scale}`);
      surface.style.setProperty("--plate-collapse", `${Math.max(0, full - collapsed)}px`);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(plate);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={surfaceRef}
      className="ui-surface home-surface relative flex h-full flex-col overflow-hidden"
    >
      <header
        ref={plateRef}
        className="home-plate pointer-events-none absolute inset-x-0 top-0 z-10 isolate px-6 pt-7 pb-6 text-[var(--ui-plate-ink)]"
      >
        <div
          aria-hidden
          className="ui-plate home-plate-bg pointer-events-auto absolute inset-0 -z-10 rounded-b-[22px]"
        />
        <button
          onClick={() => navigateToSection("profile")}
          aria-label="Open profile"
          className="pointer-events-auto absolute right-6 top-5 shrink-0 rounded-full border border-[var(--ui-plate-edge)] p-3 text-[var(--ui-plate-ink-soft)] transition-colors hover:text-[var(--ui-plate-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-plate-ink)] active:scale-95"
        >
          <User className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="home-greeting pr-14">
          <p className="text-[13px] text-[var(--ui-plate-ink-soft)]">{getGreeting()}</p>
          <h1 className="mt-0.5 truncate text-[30px] font-semibold leading-[1.15] tracking-[-0.02em]">
            {firstName}
          </h1>
        </div>

        <div ref={worthRef} className="home-worth mt-7">
          <p className="text-[12px] text-[var(--ui-plate-ink-soft)]">Net worth</p>
          <div
            ref={amountRef}
            className="home-amount ui-num mt-2 w-fit text-[clamp(38px,11.5vw,54px)] font-medium leading-none tracking-[-0.02em]"
          >
            {animate ? (
              <AnimatedNumber value={netWorth} formatFn={fmt} animateOnMount />
            ) : (
              <span>{fmt(netWorth)}</span>
            )}
          </div>
          {dailySalary && (
            <p className="home-earning mt-3.5 flex items-center gap-2 text-[12px] text-[var(--ui-plate-ink-soft)]">
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

      <main
        className="home-scroller scroll-optimized flex-1 overflow-y-auto px-4 pb-32"
        style={{ paddingTop: "calc(var(--plate-full, 260px) + 20px)" }}
      >
        <div style={{ minHeight: "calc(100% + var(--plate-collapse, 64px))" }}>
          <NutritionSummary />
          <div className="py-7">
            <TodayWorkout />
          </div>
          <Notes />
        </div>
      </main>
    </div>
  );
}
