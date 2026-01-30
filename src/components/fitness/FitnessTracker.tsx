import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TopTabs } from "@/components/navigation/TopTabs";
import { HEALTH_NAV_ITEMS } from "@/components/navigation/constants";
import type { HealthView } from "@/types/navigation";
import { useHealthData } from "@/hooks/useHealthData";
import { HealthStatsEditDialog } from "./HealthStatsCard";
import { ShoppingList } from "./ShoppingList";
import { NutritionCard } from "./NutritionCard";

const HEALTH_VIEWS = ["nutrition"] as const;

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

interface NutritionViewProps {
  onEditHealth: () => void;
}

function NutritionView({ onEditHealth }: NutritionViewProps) {
  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* Main TDEE Card - Clickable */}
      <NutritionCard onEdit={onEditHealth} />

      {/* Shopping List - takes remaining space */}
      <div className="flex-1 min-h-0">
        <ShoppingList />
      </div>
    </div>
  );
}

export function HealthTracker({
  activeView,
  onViewChange,
  onGoHome,
}: HealthTrackerProps) {
  const { userStats, updateInCache } = useHealthData();
  const [showHealthDialog, setShowHealthDialog] = useState(false);

  // Swipe navigation for mobile (no View Transitions - Framer Motion handles animations)
  // Note: Currently only one view, swipe will be disabled automatically
  const { ref: swipeRef } = useSwipeNavigation({
    views: HEALTH_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with TopTabs */}
      <header className="shrink-0 bg-background">
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
              <NutritionView onEditHealth={() => setShowHealthDialog(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Health Stats Edit Dialog */}
      <HealthStatsEditDialog
        open={showHealthDialog}
        onOpenChange={setShowHealthDialog}
        userStats={userStats ?? null}
        onUpdate={updateInCache}
      />
    </div>
  );
}
