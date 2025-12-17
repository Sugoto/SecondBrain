import { useState, lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./hooks/useTheme";
import { ExpenseDataProvider, usePrefetchTransactions } from "./hooks/useExpenseData";
import { DynamicBottomNav } from "./components/navigation/DynamicBottomNav";
import { HOME_NAV_ITEMS, HEALTH_NAV_ITEMS } from "./components/navigation/constants";
import { Toaster } from "./components/ui/sonner";
import { Spinner } from "./components/ui/spinner";
import type { AppSection, HealthView } from "./types/navigation";

// Lazy load page components for code splitting
const HomePage = lazy(() =>
  import("./components/home/HomePage").then((m) => ({ default: m.HomePage }))
);
const FinanceTracker = lazy(() =>
  import("./components/finances").then((m) => ({ default: m.FinanceTracker }))
);
const HealthTracker = lazy(() =>
  import("./components/fitness/FitnessTracker").then((m) => ({
    default: m.HealthTracker,
  }))
);

// Loading fallback component
function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

const PAGE_ANIMATION = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

function AppContent() {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const [healthView, setHealthView] = useState<HealthView>("nutrition");
  const { prefetch: prefetchTransactions } = usePrefetchTransactions();

  // Prefetch data when hovering over nav items
  const handlePrefetch = useCallback(
    (id: string) => {
      if (id === "finances") {
        prefetchTransactions();
      }
      // Could add more prefetch handlers for other sections
    },
    [prefetchTransactions]
  );

  const getNavItems = () => {
    switch (currentSection) {
      case "finances":
        return [];
      case "fitness":
        return HEALTH_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  };

  const getActiveView = () => {
    switch (currentSection) {
      case "fitness":
        return healthView;
      default:
        return currentSection;
    }
  };

  const handleViewChange = (view: string) => {
    if (currentSection === "home") {
      // Navigate to sub-section
      setCurrentSection(view as AppSection);
    } else if (currentSection === "fitness") {
      setHealthView(view as HealthView);
    }
  };

  const handleGoHome = () => {
    setCurrentSection("home");
  };

  return (
    <div className="h-[100dvh] bg-background overflow-hidden">
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          {currentSection === "home" && (
            <motion.div key="home" className="h-full" {...PAGE_ANIMATION}>
              <HomePage />
            </motion.div>
          )}

          {currentSection === "finances" && (
            <motion.div key="finances" className="h-full" {...PAGE_ANIMATION}>
              <FinanceTracker onGoHome={handleGoHome} />
            </motion.div>
          )}

          {currentSection === "fitness" && (
            <motion.div key="fitness" className="h-full" {...PAGE_ANIMATION}>
              <HealthTracker
                activeView={healthView}
                onViewChange={(view) => setHealthView(view)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>

      {currentSection !== "finances" && (
        <DynamicBottomNav
          currentSection={currentSection}
          activeView={getActiveView()}
          navItems={getNavItems()}
          onViewChange={handleViewChange}
          onGoHome={handleGoHome}
          onPrefetch={handlePrefetch}
        />
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ExpenseDataProvider>
        <AppContent />
      </ExpenseDataProvider>
    </ThemeProvider>
  );
}

export default App;
