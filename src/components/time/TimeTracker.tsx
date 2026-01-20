import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hourglass, Castle } from "lucide-react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TimeView } from "@/types/navigation";
import { CalendarView } from "./CalendarView";
import { TodayView } from "./TodayView";
import { TrendsView } from "./TrendsView";
import { OfficeDialog } from "./OfficeDialog";

const TIME_VIEWS = ["calendar", "today", "trends"] as const;

interface TimeTrackerProps {
  activeView: TimeView;
  onViewChange: (view: TimeView) => void;
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

export function TimeTracker({ activeView, onViewChange }: TimeTrackerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showOfficeDialog, setShowOfficeDialog] = useState(false);

  // Swipe navigation for mobile
  const swipeHandlers = useSwipeNavigation({
    views: TIME_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-background p-4">
        <PageHeader
          title="Quest Log"
          icon={Hourglass}
          iconGradient="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
          iconShadow="0 4px 12px rgba(20, 184, 166, 0.4)"
          accentColor="#14b8a6"
          noBackground
        >
          {/* Go to Guild Hall Button */}
          <button
            onClick={() => setShowOfficeDialog(true)}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            style={{
              background: isDark
                ? "rgba(20, 184, 166, 0.15)"
                : "rgba(20, 184, 166, 0.1)",
              border: "1px solid rgba(20, 184, 166, 0.3)",
            }}
          >
            <Castle className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-[11px] font-medium text-teal-500 font-fantasy tracking-wide">Guild</span>
          </button>
        </PageHeader>
      </header>

      {/* Office Dialog */}
      <OfficeDialog
        open={showOfficeDialog}
        onOpenChange={setShowOfficeDialog}
      />

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto pb-20 overscroll-contain touch-pan-y"
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait">
          {activeView === "calendar" && (
            <motion.div key="calendar" {...VIEW_ANIMATION}>
              <CalendarView />
            </motion.div>
          )}
          {activeView === "today" && (
            <motion.div key="today" {...VIEW_ANIMATION}>
              <TodayView />
            </motion.div>
          )}
          {activeView === "trends" && (
            <motion.div key="trends" {...VIEW_ANIMATION}>
              <TrendsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
