import { motion, AnimatePresence } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TopTabs } from "@/components/navigation/TopTabs";
import { OMSCS_NAV_ITEMS } from "@/components/navigation/constants";
import type { OmscsView } from "@/types/navigation";
import { GradesView } from "./GradesView";
import { SemesterView } from "./SemesterView";
import { CoursesView } from "./CoursesView";

const OMSCS_VIEWS = ["grades", "semester", "courses"] as const;

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

interface OmscsTrackerProps {
  activeView: OmscsView;
  onViewChange: (view: OmscsView) => void;
  onGoHome: () => void;
}

export function OmscsTracker({ activeView, onViewChange, onGoHome }: OmscsTrackerProps) {
  const { ref: swipeRef } = useSwipeNavigation({
    views: OMSCS_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with TopTabs */}
      <header className="shrink-0 bg-background">
        <TopTabs
          navItems={OMSCS_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as OmscsView)}
          onGoHome={onGoHome}
          title="OMSCS"
        />
      </header>

      <main
        ref={swipeRef as React.RefObject<HTMLElement>}
        className="flex-1 overflow-y-auto pb-4 overscroll-contain"
      >
        <AnimatePresence mode="wait">
          {activeView === "grades" && (
            <motion.div key="grades" {...VIEW_ANIMATION}>
              <GradesView />
            </motion.div>
          )}
          {activeView === "semester" && (
            <motion.div key="semester" {...VIEW_ANIMATION}>
              <SemesterView />
            </motion.div>
          )}
          {activeView === "courses" && (
            <motion.div key="courses" {...VIEW_ANIMATION}>
              <CoursesView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
