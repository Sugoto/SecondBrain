import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./hooks/useTheme";
import { ExpenseTracker } from "./components/expense-tracker";
import { HomePage } from "./components/home/HomePage";
import { FitnessTracker, FITNESS_NAV_ITEMS } from "./components/fitness/FitnessTracker";
import { DynamicBottomNav, HOME_NAV_ITEMS } from "./components/navigation/DynamicBottomNav";
import { Toaster } from "./components/ui/sonner";
import type { AppSection, FitnessView } from "./types/navigation";

const PAGE_ANIMATION = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

function AppContent() {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const [fitnessView, setFitnessView] = useState<FitnessView>("dashboard");

  // Get the appropriate nav items based on current section
  const getNavItems = () => {
    switch (currentSection) {
      case "expenses":
        // Return expense nav items - but ExpenseTracker has its own internal nav
        return [];
      case "fitness":
        return FITNESS_NAV_ITEMS;
      default:
        return HOME_NAV_ITEMS;
    }
  };

  // Get the active view for the current section
  const getActiveView = () => {
    switch (currentSection) {
      case "fitness":
        return fitnessView;
      default:
        return currentSection;
    }
  };

  // Handle view change based on current section
  const handleViewChange = (view: string) => {
    if (currentSection === "home") {
      // Navigate to sub-section
      setCurrentSection(view as AppSection);
    } else if (currentSection === "fitness") {
      setFitnessView(view as FitnessView);
    }
  };

  const handleGoHome = () => {
    setCurrentSection("home");
  };

  const handleNavigate = (section: AppSection) => {
    setCurrentSection(section);
  };

  return (
    <div className="h-[100dvh] bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {currentSection === "home" && (
          <motion.div key="home" className="h-full" {...PAGE_ANIMATION}>
            <HomePage onNavigate={handleNavigate} />
          </motion.div>
        )}

        {currentSection === "expenses" && (
          <motion.div key="expenses" className="h-full" {...PAGE_ANIMATION}>
            <ExpenseTracker onGoHome={handleGoHome} />
          </motion.div>
        )}

        {currentSection === "fitness" && (
          <motion.div key="fitness" className="h-full" {...PAGE_ANIMATION}>
            <FitnessTracker
              activeView={fitnessView}
              onViewChange={(view) => setFitnessView(view)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Bottom Nav - show on home and fitness, expenses has its own */}
      {currentSection !== "expenses" && (
        <DynamicBottomNav
          currentSection={currentSection}
          activeView={getActiveView()}
          navItems={getNavItems()}
          onViewChange={handleViewChange}
          onGoHome={handleGoHome}
        />
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
