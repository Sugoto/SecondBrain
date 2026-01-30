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
      className="w-full text-left rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <div className="space-y-2.5">
        {/* Header Row: Calories */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-mono text-muted-foreground line-through">
              {formatNumber(tdee.tdee)}
            </span>
            <span className="text-lg font-bold font-mono text-foreground">
              {formatNumber(tdee.targetCalories)}
            </span>
            <span className="text-[10px] text-muted-foreground">kcal</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Macros + Water Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted">
            <Beef className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold font-mono text-foreground leading-none">{tdee.protein}g</p>
              <p className="text-[7px] text-muted-foreground">Protein</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted">
            <Wheat className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold font-mono text-foreground leading-none">{tdee.carbs}g</p>
              <p className="text-[7px] text-muted-foreground">Carbs</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted">
            <Droplet className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold font-mono text-foreground leading-none">{tdee.fat}g</p>
              <p className="text-[7px] text-muted-foreground">Fat</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted">
            <GlassWater className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold font-mono text-foreground leading-none">{waterLiters.toFixed(1)}L</p>
              <p className="text-[7px] text-muted-foreground">Water</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
