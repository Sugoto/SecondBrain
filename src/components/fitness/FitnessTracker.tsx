import { motion, AnimatePresence } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TopTabs } from "@/components/navigation/TopTabs";
import { HEALTH_NAV_ITEMS } from "@/components/navigation/constants";
import type { HealthView } from "@/types/navigation";
import { ShoppingList } from "./ShoppingList";
import { NutritionCard } from "./NutritionCard";
import { MealPlanner } from "./MealPlanner";
import { WorkoutsView } from "./WorkoutsView";

const HEALTH_VIEWS = ["nutrition", "workouts", "shopping"] as const;

interface HealthTrackerProps {
  activeView: HealthView;
  onViewChange: (view: HealthView) => void;
  onGoHome: () => void;
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.2, ease: [0.2, 0, 0, 1] as const },
};

function NutritionView() {
  return (
    <div className="divide-y divide-zinc-300 dark:divide-zinc-700">
      <NutritionCard />
      <MealPlanner />
    </div>
  );
}

function ShoppingView() {
  return (
    <div className="px-6 pt-6 pb-6 h-full flex flex-col">
      <ShoppingList />
    </div>
  );
}

export function HealthTracker({
  activeView,
  onViewChange,
  onGoHome,
}: HealthTrackerProps) {
  const { ref: swipeRef } = useSwipeNavigation({
    views: HEALTH_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 bg-background border-b border-zinc-300 dark:border-zinc-700">
        <TopTabs
          navItems={HEALTH_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as HealthView)}
          onGoHome={onGoHome}
          title="Health"
        />
      </header>

      <main
        ref={swipeRef as React.RefObject<HTMLElement>}
        className="flex-1 overflow-y-auto pb-28 overscroll-contain"
      >
        <AnimatePresence mode="wait">
          {activeView === "nutrition" && (
            <motion.div key="nutrition" {...VIEW_ANIMATION}>
              <NutritionView />
            </motion.div>
          )}
          {activeView === "workouts" && (
            <motion.div key="workouts" {...VIEW_ANIMATION}>
              <WorkoutsView />
            </motion.div>
          )}
          {activeView === "shopping" && (
            <motion.div key="shopping" {...VIEW_ANIMATION} className="h-full">
              <ShoppingView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
