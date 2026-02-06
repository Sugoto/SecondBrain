import { useMemo } from "react";
import {
  Droplet,
  GlassWater,
  ChevronRight,
  Beef,
  Wheat,
} from "lucide-react";
import { useHealthData } from "@/hooks/useHealthData";
import { calculateTDEE, formatNumber } from "./utils";

// Hardcoded moderate activity multiplier
const MODERATE_MULTIPLIER = 1.55;

interface NutritionCardProps {
  onEdit: () => void;
}

export function NutritionCard({ onEdit }: NutritionCardProps) {
  const { userStats } = useHealthData();

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE(
      {
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
        activity_level: "moderate",
      },
      MODERATE_MULTIPLIER
    );
  }, [userStats]);

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
    <button
      onClick={onEdit}
      className="w-full text-left rounded-xl bg-pastel-blue p-4 neo-brutal"
    >
      <div className="space-y-3">
        {/* Header Row: Calories */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-mono text-black/40 dark:text-white/40 line-through">
              {formatNumber(tdee.tdee)}
            </span>
            <span className="text-2xl font-bold font-mono text-black dark:text-white">
              {formatNumber(tdee.targetCalories)}
            </span>
            <span className="text-sm text-black/70 dark:text-white/70 font-bold">kcal</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center border-2 border-black dark:border-white">
            <ChevronRight className="h-5 w-5 text-black dark:text-white" />
          </div>
        </div>

        {/* Macros + Water Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-white dark:bg-white/10 border-2 border-black dark:border-white">
            <Beef className="h-4 w-4 text-black dark:text-white shrink-0" />
            <p className="text-sm font-bold font-mono text-black dark:text-white">{tdee.protein}g</p>
            <p className="text-[9px] text-black/70 dark:text-white/70 font-bold uppercase">Protein</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-white dark:bg-white/10 border-2 border-black dark:border-white">
            <Wheat className="h-4 w-4 text-black dark:text-white shrink-0" />
            <p className="text-sm font-bold font-mono text-black dark:text-white">{tdee.carbs}g</p>
            <p className="text-[9px] text-black/70 dark:text-white/70 font-bold uppercase">Carbs</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-white dark:bg-white/10 border-2 border-black dark:border-white">
            <Droplet className="h-4 w-4 text-black dark:text-white shrink-0" />
            <p className="text-sm font-bold font-mono text-black dark:text-white">{tdee.fat}g</p>
            <p className="text-[9px] text-black/70 dark:text-white/70 font-bold uppercase">Fat</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-white dark:bg-white/10 border-2 border-black dark:border-white">
            <GlassWater className="h-4 w-4 text-black dark:text-white shrink-0" />
            <p className="text-sm font-bold font-mono text-black dark:text-white">{waterLiters.toFixed(1)}L</p>
            <p className="text-[9px] text-black/70 dark:text-white/70 font-bold uppercase">Water</p>
          </div>
        </div>
      </div>
    </button>
  );
}
