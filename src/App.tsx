import { lazy, Suspense, useCallback, useMemo } from "react";
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
  OMSCS_NAV_ITEMS,
  TIME_NAV_ITEMS,
} from "./components/navigation/constants";
import { Toaster } from "./components/ui/sonner";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import { useAppNavigation } from "./hooks/useAppNavigation";
import type { AppSection } from "./types/navigation";

// Main sections for swipe navigation
const APP_SECTIONS = ["home", "omscs", "finances", "time", "fitness"] as const;

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
const OmscsTracker = lazy(() =>
  import("./components/omscs/OmscsTracker").then((m) => ({
    default: m.OmscsTracker,
  }))
);
const TimeTracker = lazy(() =>
  import("./components/time").then((m) => ({
    default: m.TimeTracker,
  }))
);

function AppContent() {
  const {
    currentSection,
    healthView,
    financeView,
    omscsView,
    timeView,
    navigateToSection,
    navigateHealthView,
    navigateFinanceView,
    navigateOmscsView,
    navigateTimeView,
    goHome,
  } = useAppNavigation();
  const { prefetch: prefetchTransactions } = usePrefetchTransactions();

  // Swipe navigation between main sections
  const sectionSwipeHandlers = useSwipeNavigation({
    views: APP_SECTIONS,
    currentView: currentSection,
    onViewChange: navigateToSection,
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
      case "time":
        return TIME_NAV_ITEMS;
      case "fitness":
        return HEALTH_NAV_ITEMS;
      case "omscs":
        return OMSCS_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  }, [currentSection]);

  const activeView = useMemo(() => {
    switch (currentSection) {
      case "finances":
        return financeView;
      case "time":
        return timeView;
      case "fitness":
        return healthView;
      case "omscs":
        return omscsView;
      default:
        return currentSection;
    }
  }, [currentSection, financeView, timeView, healthView, omscsView]);

  // Handle nav view changes
  const handleViewChange = useCallback(
    (view: string) => {
      if (currentSection === "home") {
        navigateToSection(view as AppSection);
      } else if (currentSection === "finances") {
        navigateFinanceView(view as import("./types/navigation").FinanceView);
      } else if (currentSection === "time") {
        navigateTimeView(view as import("./types/navigation").TimeView);
      } else if (currentSection === "fitness") {
        navigateHealthView(view as import("./types/navigation").HealthView);
      } else if (currentSection === "omscs") {
        navigateOmscsView(view as import("./types/navigation").OmscsView);
      }
    },
    [currentSection, navigateToSection, navigateFinanceView, navigateTimeView, navigateHealthView, navigateOmscsView]
  );

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
            <OmscsTracker
              activeView={omscsView}
              onViewChange={navigateOmscsView}
            />
          )}
          {currentSection === "finances" && (
            <FinanceTracker
              activeView={financeView}
              onViewChange={navigateFinanceView}
            />
          )}
          {currentSection === "time" && (
            <TimeTracker
              activeView={timeView}
              onViewChange={navigateTimeView}
            />
          )}
          {currentSection === "fitness" && (
            <HealthTracker
              activeView={healthView}
              onViewChange={navigateHealthView}
            />
          )}
        </div>
      </Suspense>

      <DynamicBottomNav
        currentSection={currentSection}
        activeView={activeView}
        navItems={navItems}
        onViewChange={handleViewChange}
        onGoHome={goHome}
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
