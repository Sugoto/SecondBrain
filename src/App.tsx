import { useState, lazy, Suspense, useCallback, useMemo } from "react";
import { ThemeProvider } from "./hooks/useTheme";
import { ExpenseDataProvider, usePrefetchTransactions } from "./hooks/useExpenseData";
import { DynamicBottomNav } from "./components/navigation/DynamicBottomNav";
import { HOME_NAV_ITEMS, HEALTH_NAV_ITEMS } from "./components/navigation/constants";
import { Toaster } from "./components/ui/sonner";
import { Spinner } from "./components/ui/spinner";
import { useViewTransition } from "./hooks/useViewTransition";
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

function AppContent() {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const [healthView, setHealthView] = useState<HealthView>("nutrition");
  const { prefetch: prefetchTransactions } = usePrefetchTransactions();
  const { startTransition } = useViewTransition();

  // Prefetch data when hovering over nav items
  const handlePrefetch = useCallback(
    (id: string) => {
      if (id === "finances") {
        prefetchTransactions();
      }
    },
    [prefetchTransactions]
  );

  // Memoize nav items to avoid recreation every render
  const navItems = useMemo(() => {
    switch (currentSection) {
      case "finances":
        return [];
      case "fitness":
        return HEALTH_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  }, [currentSection]);

  const activeView = useMemo(() => {
    switch (currentSection) {
      case "fitness":
        return healthView;
      default:
        return currentSection;
    }
  }, [currentSection, healthView]);

  // Use View Transitions API for native browser animations
  const handleViewChange = useCallback((view: string) => {
    startTransition(() => {
      if (currentSection === "home") {
        setCurrentSection(view as AppSection);
      } else if (currentSection === "fitness") {
        setHealthView(view as HealthView);
      }
    });
  }, [currentSection, startTransition]);

  const handleGoHome = useCallback(() => {
    startTransition(() => {
      setCurrentSection("home");
    });
  }, [startTransition]);

  return (
    <div className="h-[100dvh] bg-background overflow-hidden">
      <Suspense fallback={<PageLoader />}>
        {/* Using CSS-based transitions with view-transition-name for native browser animation */}
        <div className="h-full page-transition" style={{ viewTransitionName: 'page-content' }}>
          {currentSection === "home" && <HomePage />}
          {currentSection === "finances" && <FinanceTracker onGoHome={handleGoHome} />}
          {currentSection === "fitness" && (
            <HealthTracker
              activeView={healthView}
              onViewChange={(view) => setHealthView(view)}
            />
          )}
        </div>
      </Suspense>

      {currentSection !== "finances" && (
        <DynamicBottomNav
          currentSection={currentSection}
          activeView={activeView}
          navItems={navItems}
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
