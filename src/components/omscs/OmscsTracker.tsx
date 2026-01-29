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

// Unified OMSCS color palette - dark slate with cyan accents
// Readable in all lighting while maintaining the mystical aesthetic
const OMSCS_COLORS = {
  // Backgrounds - rich slate-blue, dark but not black
  bgPrimary: "#1e2937", // Main background
  bgSecondary: "#263241", // Cards, elevated surfaces
  bgHeader: "rgba(30, 41, 55, 0.97)", // Header with slight transparency
  // Text - high contrast for readability
  textPrimary: "#f1f5f9", // Main text
  textSecondary: "#94a3b8", // Muted text
  textMuted: "#64748b", // Very muted text
  // Accent - cyan theme
  accent: "#06b6d4",
  accentMuted: "rgba(6, 182, 212, 0.15)",
  // Borders
  border: "rgba(100, 116, 139, 0.25)",
  borderLight: "rgba(148, 163, 184, 0.1)",
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
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        // Unified dusk gradient - rich slate-blue
        background: `radial-gradient(ellipse at top, ${OMSCS_COLORS.bgSecondary} 0%, ${OMSCS_COLORS.bgPrimary} 50%, #171f2a 100%)`,
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.35) 100%)`,
        }}
      />

      {/* Header with TopTabs */}
      <header
        className="relative shrink-0 z-10"
        style={{
          background: OMSCS_COLORS.bgHeader,
          backdropFilter: "blur(12px)",
        }}
      >
        <TopTabs
          navItems={OMSCS_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as OmscsView)}
          onGoHome={onGoHome}
          title="University"
          accentColor={OMSCS_COLORS.accent}
          forceDark
        />
      </header>

      <main
        ref={swipeRef as React.RefObject<HTMLElement>}
        className="relative flex-1 overflow-y-auto pb-4 overscroll-contain"
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

// Export colors for use in child components
export { OMSCS_COLORS };
