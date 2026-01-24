import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Droplet,
  GlassWater,
  ChevronRight,
  Beef,
  Wheat,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Card } from "@/components/ui/card";
import { TopTabs } from "@/components/navigation/TopTabs";
import { HEALTH_NAV_ITEMS } from "@/components/navigation/constants";
import type { HealthView } from "@/types/navigation";
import { useHealthData } from "@/hooks/useHealthData";
import { HealthStatsEditDialog } from "./HealthStatsCard";
import { ShoppingList } from "./ShoppingList";
import { calculateTDEE, formatNumber, getActivityLevelInfo } from "./utils";

const HEALTH_VIEWS = ["nutrition"] as const;

interface HealthTrackerProps {
  activeView: HealthView;
  onViewChange: (view: HealthView) => void;
  onGoHome: () => void;
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
  const { userStats, activityLog } = useHealthData();

  // Calculate dynamic activity level based on activity log
  const activityInfo = useMemo(() => {
    return getActivityLevelInfo(activityLog);
  }, [activityLog]);

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
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* Main TDEE Card - Clickable */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onEditHealth}
        className="w-full text-left"
      >
        <Card
          className="p-3 overflow-hidden relative border"
          style={{
            borderColor: "rgba(128, 128, 128, 0.1)",
          }}
        >
          <div className="relative z-10 space-y-2.5">
            {/* Header Row: Calories */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Flame className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground line-through">
                    {formatNumber(tdee.tdee)}
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-500">
                    {formatNumber(tdee.targetCalories)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">kcal</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Macros + Water Row */}
            <div className="grid grid-cols-4 gap-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)" }}>
                <Beef className="h-3 w-3 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-mono text-amber-500 leading-none">{tdee.protein}g</p>
                  <p className="text-[7px] text-muted-foreground">Protein</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)" }}>
                <Wheat className="h-3 w-3 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-mono text-blue-500 leading-none">{tdee.carbs}g</p>
                  <p className="text-[7px] text-muted-foreground">Carbs</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: isDark ? "rgba(244, 63, 94, 0.1)" : "rgba(244, 63, 94, 0.08)" }}>
                <Droplet className="h-3 w-3 text-rose-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-mono text-rose-500 leading-none">{tdee.fat}g</p>
                  <p className="text-[7px] text-muted-foreground">Fat</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: isDark ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.08)" }}>
                <GlassWater className="h-3 w-3 text-cyan-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-mono text-cyan-500 leading-none">{waterLiters.toFixed(1)}L</p>
                  <p className="text-[7px] text-muted-foreground">Water</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.button>

      {/* Shopping List - takes remaining space */}
      <div className="flex-1 min-h-0">
        <ShoppingList />
      </div>
    </div>
  );
}

export function HealthTracker({
  activeView,
  onViewChange,
  onGoHome,
}: HealthTrackerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { userStats, updateInCache } = useHealthData();
  const [showHealthDialog, setShowHealthDialog] = useState(false);

  // Swipe navigation for mobile (no View Transitions - Framer Motion handles animations)
  const swipeHandlers = useSwipeNavigation({
    views: HEALTH_VIEWS,
    currentView: activeView,
    onViewChange,
    useViewTransitions: false,
  });

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        // Vitality/health warm parchment background
        background: isDark
          ? `radial-gradient(ellipse at top, #2a1f1f 0%, #1a1212 50%, #0f0a0a 100%)`
          : `radial-gradient(ellipse at top, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)`,
      }}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.05 : 0.08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.6) 100%)`
            : `radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(239, 68, 68, 0.1) 100%)`,
        }}
      />

      {/* Header with TopTabs */}
      <header
        className="relative shrink-0 z-10"
        style={{
          background: isDark
            ? "rgba(26, 18, 18, 0.95)"
            : "rgba(254, 242, 242, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <TopTabs
          navItems={HEALTH_NAV_ITEMS}
          activeView={activeView}
          onViewChange={(view) => onViewChange(view as HealthView)}
          onGoHome={onGoHome}
          title="Vitality"
          accentColor="#ef4444"
        />
      </header>

      {/* Main Content */}
      <main
        className="relative flex-1 overflow-y-auto pb-4 overscroll-contain touch-pan-y"
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait">
          {activeView === "nutrition" && (
            <motion.div key="nutrition" {...VIEW_ANIMATION}>
              <NutritionView onEditHealth={() => setShowHealthDialog(true)} />
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
