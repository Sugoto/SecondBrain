import { useCallback, useMemo } from "react";
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
} from "./components/navigation/constants";
import { Toaster } from "./components/ui/sonner";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import { useAppNavigation } from "./hooks/useAppNavigation";
import type { AppSection } from "./types/navigation";
import { HomePage } from "./components/home/HomePage";
import { FinanceTracker } from "./components/finances";
import { HealthTracker } from "./components/fitness/FitnessTracker";
import { OmscsTracker } from "./components/omscs/OmscsTracker";

// Main sections for swipe navigation
const APP_SECTIONS = ["home", "omscs", "finances", "fitness"] as const;

function AppContent() {
  const {
    currentSection,
    healthView,
    financeView,
    omscsView,
    navigateToSection,
    navigateHealthView,
    navigateFinanceView,
    navigateOmscsView,
    goHome,
  } = useAppNavigation();
  const { prefetch: prefetchTransactions } = usePrefetchTransactions();

  // Swipe navigation between main sections
  const { ref: sectionSwipeRef } = useSwipeNavigation({
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
      case "fitness":
        return HEALTH_NAV_ITEMS;
      case "omscs":
        return OMSCS_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  }, [currentSection]);


  // Handle nav view changes
  const handleViewChange = useCallback(
    (view: string) => {
      if (currentSection === "home") {
        navigateToSection(view as AppSection);
      } else if (currentSection === "finances") {
        navigateFinanceView(view as import("./types/navigation").FinanceView);
      } else if (currentSection === "fitness") {
        navigateHealthView(view as import("./types/navigation").HealthView);
      } else if (currentSection === "omscs") {
        navigateOmscsView(view as import("./types/navigation").OmscsView);
      }
    },
    [currentSection, navigateToSection, navigateFinanceView, navigateHealthView, navigateOmscsView]
  );

  return (
    <div className="h-[100dvh] bg-background overflow-hidden">
      <div className="h-full">
        {currentSection === "home" && (
          <div
            ref={sectionSwipeRef as React.RefObject<HTMLDivElement>}
            className="h-full overscroll-contain"
          >
            <HomePage />
          </div>
        )}
        {currentSection === "omscs" && (
          <OmscsTracker
            activeView={omscsView}
            onViewChange={navigateOmscsView}
            onGoHome={goHome}
          />
        )}
        {currentSection === "finances" && (
          <FinanceTracker
            activeView={financeView}
            onViewChange={navigateFinanceView}
            onGoHome={goHome}
          />
        )}
        {currentSection === "fitness" && (
          <HealthTracker
            activeView={healthView}
            onViewChange={navigateHealthView}
            onGoHome={goHome}
          />
        )}
      </div>

      {/* Only show bottom nav on home page */}
      {currentSection === "home" && (
        <DynamicBottomNav
          navItems={navItems}
          onViewChange={handleViewChange}
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
