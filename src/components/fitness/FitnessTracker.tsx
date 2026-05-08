import { motion, AnimatePresence } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TopTabs } from "@/components/navigation/TopTabs";
import { HEALTH_NAV_ITEMS } from "@/components/navigation/constants";
import type { HealthView } from "@/types/navigation";
import { ShoppingList } from "./ShoppingList";
import { NutritionCard } from "./NutritionCard";
import { MealPlanner } from "./MealPlanner";

const HEALTH_VIEWS = ["nutrition", "shopping"] as const;

interface HealthTrackerProps {
  activeView: HealthView;
  onViewChange: (view: HealthView) => void;
  onGoHome: () => void;
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

function NutritionView() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <NutritionCard />
      <MealPlanner />
    </div>
  );
}

function ShoppingView() {
  return (
    <div className="p-4 flex flex-col h-full">
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
      {/* Header with TopTabs */}
      <header className="shrink-0 vercel-header pb-3">
        <TopTabs
          navItems={HEALTH_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as HealthView)}
          onGoHome={onGoHome}
          title="Fitness"
        />
      </header>

      {/* Main Content */}
      <main
        ref={swipeRef as React.RefObject<HTMLElement>}
        className="flex-1 overflow-y-auto pb-4 overscroll-contain"
      >
        <AnimatePresence mode="wait">
          {activeView === "nutrition" && (
            <motion.div key="nutrition" {...VIEW_ANIMATION}>
              <NutritionView />
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
