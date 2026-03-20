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
      className="w-full text-left rounded-xl bg-card border border-border p-3 transition-colors hover:bg-muted"
    >
      <div className="space-y-2">
        {/* Header Row: Calories */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-mono text-muted-foreground line-through">
              {formatNumber(tdee.tdee)}
            </span>
            <span className="text-xl font-bold font-mono text-foreground">
              {formatNumber(tdee.targetCalories)}
            </span>
            <span className="text-xs text-muted-foreground font-bold">kcal</span>
          </div>
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center border border-border">
            <ChevronRight className="h-3.5 w-3.5 text-foreground" />
          </div>
        </div>

        {/* Macros + Water Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-muted border border-border">
            <Beef className="h-3 w-3 text-foreground shrink-0" />
            <p className="text-xs font-bold font-mono text-foreground">{tdee.protein}g</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">Protein</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-muted border border-border">
            <Wheat className="h-3 w-3 text-foreground shrink-0" />
            <p className="text-xs font-bold font-mono text-foreground">{tdee.carbs}g</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">Carbs</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-muted border border-border">
            <Droplet className="h-3 w-3 text-foreground shrink-0" />
            <p className="text-xs font-bold font-mono text-foreground">{tdee.fat}g</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">Fat</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-muted border border-border">
            <GlassWater className="h-3 w-3 text-foreground shrink-0" />
            <p className="text-xs font-bold font-mono text-foreground">{waterLiters.toFixed(1)}L</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">Water</p>
          </div>
        </div>
      </div>
    </button>
  );
}
