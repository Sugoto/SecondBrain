import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageHeader } from "@/components/shared/PageHeader";
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
}

export function OmscsTracker({ activeView, onViewChange }: OmscsTrackerProps) {
  const swipeHandlers = useSwipeNavigation({
    views: OMSCS_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 bg-background p-4">
        <PageHeader
          title="Arcane Studies"
          icon={Sparkles}
          iconGradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          iconShadow="0 4px 12px rgba(6, 182, 212, 0.4)"
          accentColor="#06b6d4"
          noBackground
        />
      </header>

      <main
        className="flex-1 overflow-y-auto pb-20 overscroll-contain touch-pan-y"
        {...swipeHandlers}
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
