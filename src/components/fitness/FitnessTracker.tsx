import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Flame,
  Droplet,
  GlassWater,
  ChevronRight,
  Beef,
  Wheat,
  Activity,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import type { HealthView } from "@/types/navigation";
import { useHealthData } from "@/hooks/useHealthData";
import { HealthStatsEditDialog } from "./HealthStatsCard";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { ShoppingList } from "./ShoppingList";
import { calculateTDEE, formatNumber, getActivityLevelInfo } from "./utils";

interface HealthTrackerProps {
  activeView: HealthView;
  onViewChange: (view: HealthView) => void;
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

interface NutritionViewProps {
  onEditHealth: () => void;
}

function NutritionView({ onEditHealth }: NutritionViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { userStats, loading, workoutDates } = useHealthData();

  // Calculate dynamic activity level based on workout frequency
  const activityInfo = useMemo(() => {
    return getActivityLevelInfo(workoutDates);
  }, [workoutDates]);

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE(
      {
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
        activity_level: activityInfo.level,
      },
      activityInfo.multiplier // Use intensity-adjusted multiplier
    );
  }, [userStats, activityInfo.level, activityInfo.multiplier]);

  // Calculate water intake
  const waterLiters = userStats?.weight_kg ? userStats.weight_kg * 0.033 : 0;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasHealthData =
    userStats?.height_cm &&
    userStats?.weight_kg &&
    userStats?.age &&
    userStats?.gender;

  // Only show if user has health data
  if (!hasHealthData || !tdee) {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Main TDEE Card - Clickable */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onEditHealth}
        className="w-full text-left"
      >
        <Card
          className="p-5 overflow-hidden relative"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.03) 100%)",
            border: isDark
              ? "1px solid rgba(16, 185, 129, 0.2)"
              : "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          {/* Decorative gradient */}
          <div
            className="absolute top-0 right-0 w-40 h-40 -mr-12 -mt-12 opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* Header with Daily Target */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Daily Target
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-muted-foreground line-through">
                      {formatNumber(tdee.tdee)}
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-500">
                      {formatNumber(tdee.targetCalories)}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Activity Level Badge */}
            <div
              className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg w-full"
              style={{
                background: isDark
                  ? "rgba(139, 92, 246, 0.15)"
                  : "rgba(139, 92, 246, 0.1)",
              }}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-[10px] font-medium text-violet-500">
                  {activityInfo.label} Activity
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium text-violet-500">
                {activityInfo.workoutsPerWeek}/week · ×{activityInfo.multiplier}
              </span>
            </div>

            {/* Macros + Water Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div
                className="p-2 rounded-xl text-center"
                style={{
                  background: isDark
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(245, 158, 11, 0.08)",
                }}
              >
                <Beef className="h-3.5 w-3.5 text-amber-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold font-mono text-amber-500">
                  {tdee.protein}g
                </p>
                <p className="text-[8px] text-muted-foreground">Protein</p>
              </div>
              <div
                className="p-2 rounded-xl text-center"
                style={{
                  background: isDark
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(59, 130, 246, 0.08)",
                }}
              >
                <Wheat className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold font-mono text-blue-500">
                  {tdee.carbs}g
                </p>
                <p className="text-[8px] text-muted-foreground">Carbs</p>
              </div>
              <div
                className="p-2 rounded-xl text-center"
                style={{
                  background: isDark
                    ? "rgba(244, 63, 94, 0.1)"
                    : "rgba(244, 63, 94, 0.08)",
                }}
              >
                <Droplet className="h-3.5 w-3.5 text-rose-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold font-mono text-rose-500">
                  {tdee.fat}g
                </p>
                <p className="text-[8px] text-muted-foreground">Fat</p>
              </div>
              <div
                className="p-2 rounded-xl text-center"
                style={{
                  background: isDark
                    ? "rgba(6, 182, 212, 0.1)"
                    : "rgba(6, 182, 212, 0.08)",
                }}
              >
                <GlassWater className="h-3.5 w-3.5 text-cyan-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold font-mono text-cyan-500">
                  {waterLiters.toFixed(1)}L
                </p>
                <p className="text-[8px] text-muted-foreground">Water</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.button>

      {/* Shopping List */}
      <ShoppingList />
    </div>
  );
}

function WorkoutsView() {
  return (
    <div className="p-4 space-y-4">
      <WorkoutCalendar />
    </div>
  );
}

export function HealthTracker({ activeView }: HealthTrackerProps) {
  const { userStats, updateInCache } = useHealthData();
  const [showHealthDialog, setShowHealthDialog] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-background p-4">
        <PageHeader
          title="Health"
          icon={Heart}
          iconGradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
          iconShadow="0 4px 12px rgba(239, 68, 68, 0.3)"
          accentColor="#ef4444"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {activeView === "nutrition" && (
            <motion.div key="nutrition" {...VIEW_ANIMATION}>
              <NutritionView onEditHealth={() => setShowHealthDialog(true)} />
            </motion.div>
          )}
          {activeView === "workouts" && (
            <motion.div key="workouts" {...VIEW_ANIMATION}>
              <WorkoutsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Health Stats Edit Dialog */}
      <HealthStatsEditDialog
        open={showHealthDialog}
        onOpenChange={setShowHealthDialog}
        userStats={userStats ?? null}
        onUpdate={updateInCache}
      />
    </div>
  );
}

