import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Apple, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import type { FitnessView } from "@/types/navigation";

interface FitnessTrackerProps {
  activeView: FitnessView;
  onViewChange: (view: FitnessView) => void;
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

function DashboardView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="p-4 space-y-4">
      <Card
        className="p-6"
        style={{
          background: isDark
            ? "rgba(30, 30, 35, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-500">0</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-orange-500">0</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 text-center text-muted-foreground">
        <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Start tracking your fitness journey</p>
        <p className="text-xs mt-1">Coming soon...</p>
      </Card>
    </div>
  );
}

function WorkoutsView() {
  return (
    <div className="p-4">
      <Card className="p-6 text-center text-muted-foreground">
        <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <h2 className="font-semibold mb-1">Workouts</h2>
        <p className="text-sm">Log and track your exercises</p>
        <p className="text-xs mt-2">Coming soon...</p>
      </Card>
    </div>
  );
}

function NutritionView() {
  return (
    <div className="p-4">
      <Card className="p-6 text-center text-muted-foreground">
        <Apple className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <h2 className="font-semibold mb-1">Nutrition</h2>
        <p className="text-sm">Track meals and macros</p>
        <p className="text-xs mt-2">Coming soon...</p>
      </Card>
    </div>
  );
}

export function FitnessTracker({ activeView }: FitnessTrackerProps) {

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Fitness & Nutrition</h1>
            <p className="text-xs text-muted-foreground">Track your health</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <motion.div key="dashboard" {...VIEW_ANIMATION}>
              <DashboardView />
            </motion.div>
          )}
          {activeView === "workouts" && (
            <motion.div key="workouts" {...VIEW_ANIMATION}>
              <WorkoutsView />
            </motion.div>
          )}
          {activeView === "nutrition" && (
            <motion.div key="nutrition" {...VIEW_ANIMATION}>
              <NutritionView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Export the nav items for the fitness section
export const FITNESS_NAV_ITEMS = [
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { id: "workouts" as const, icon: Dumbbell, label: "Workouts" },
  { id: "nutrition" as const, icon: Apple, label: "Nutrition" },
];

