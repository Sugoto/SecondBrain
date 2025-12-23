import { useState, lazy, Suspense, useCallback, useMemo } from "react";
import { ThemeProvider } from "./hooks/useTheme";
import {
  ExpenseDataProvider,
  usePrefetchTransactions,
} from "./hooks/useExpenseData";
import { DynamicBottomNav } from "./components/navigation/DynamicBottomNav";
import {
  HOME_NAV_ITEMS,
  HEALTH_NAV_ITEMS,
  FINANCE_NAV_ITEMS,
} from "./components/navigation/constants";
import { Toaster } from "./components/ui/sonner";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import type { AppSection, HealthView, FinanceView } from "./types/navigation";

// Main sections for swipe navigation
const APP_SECTIONS = ["home", "omscs", "finances", "fitness"] as const;

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

function AppContent() {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const [healthView, setHealthView] = useState<HealthView>("nutrition");
  const [financeView, setFinanceView] = useState<FinanceView>("expenses");
  const { prefetch: prefetchTransactions } = usePrefetchTransactions();

  // Swipe navigation between main sections
  const sectionSwipeHandlers = useSwipeNavigation({
    views: APP_SECTIONS,
    currentView: currentSection,
    onViewChange: setCurrentSection,
    useViewTransitions: false,
  });

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
        return FINANCE_NAV_ITEMS;
      case "fitness":
        return HEALTH_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  }, [currentSection]);

  const activeView = useMemo(() => {
    switch (currentSection) {
      case "finances":
        return financeView;
      case "fitness":
        return healthView;
      default:
        return currentSection;
    }
  }, [currentSection, financeView, healthView]);

  // Handle nav view changes
  const handleViewChange = useCallback(
    (view: string) => {
      if (currentSection === "home") {
        setCurrentSection(view as AppSection);
      } else if (currentSection === "finances") {
        setFinanceView(view as FinanceView);
      } else if (currentSection === "fitness") {
        setHealthView(view as HealthView);
      }
    },
    [currentSection]
  );

  const handleGoHome = useCallback(() => {
    setCurrentSection("home");
  }, []);

  return (
    <div className="h-[100dvh] bg-background overflow-hidden">
      {/* No loading fallback - components render instantly with cached data */}
      <Suspense fallback={null}>
        <div className="h-full">
          {currentSection === "home" && (
            <div
              className="h-full overscroll-contain touch-pan-y"
              {...sectionSwipeHandlers}
            >
              <HomePage />
            </div>
          )}
          {currentSection === "omscs" && (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">OMSCS</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            </div>
          )}
          {currentSection === "finances" && (
            <FinanceTracker
              activeView={financeView}
              onViewChange={setFinanceView}
            />
          )}
          {currentSection === "fitness" && (
            <HealthTracker
              activeView={healthView}
              onViewChange={setHealthView}
            />
          )}
        </div>
      </Suspense>

      <DynamicBottomNav
        currentSection={currentSection}
        activeView={activeView}
        navItems={navItems}
        onViewChange={handleViewChange}
        onGoHome={handleGoHome}
        onPrefetch={handlePrefetch}
      />

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
