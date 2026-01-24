import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const swipeHandlers = useSwipeNavigation({
    views: OMSCS_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        // Arcane/mystical parchment background
        background: isDark
          ? `radial-gradient(ellipse at top, #1a1f2e 0%, #0f1419 50%, #090b0f 100%)`
          : `radial-gradient(ellipse at top, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)`,
      }}
    >
      {/* Mystical texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.05 : 0.08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.6) 100%)`
            : `radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(6, 182, 212, 0.1) 100%)`,
        }}
      />

      {/* Header with TopTabs */}
      <header
        className="relative shrink-0 z-10"
        style={{
          background: isDark
            ? "rgba(15, 20, 25, 0.95)"
            : "rgba(224, 242, 254, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <TopTabs
          navItems={OMSCS_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as OmscsView)}
          onGoHome={onGoHome}
          title="University"
          accentColor="#06b6d4"
        />
      </header>

      <main
        className="relative flex-1 overflow-y-auto pb-4 overscroll-contain touch-pan-y"
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
