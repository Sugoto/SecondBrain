import { useMemo } from "react";
import {
  Droplet,
  GlassWater,
  Beef,
  Wheat,
  Leaf,
} from "lucide-react";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateTDEE, formatNumber } from "./utils";

export function NutritionCard() {
  const { userStats } = useUserStats();

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE({
      height_cm: userStats.height_cm,
      weight_kg: userStats.weight_kg,
      age: userStats.age,
      gender: userStats.gender,
      activity_level: userStats.activity_level,
      calorie_adjustment: userStats.calorie_adjustment,
    });
  }, [userStats]);

  const waterLiters = 3;

  const hasHealthData =
    userStats?.height_cm &&
    userStats?.weight_kg &&
    userStats?.age &&
    userStats?.gender;

  if (!hasHealthData || !tdee) return null;

  return (
    <div className="w-full bg-card border border-outline-variant rounded-2xl px-5 py-4 mb-2.5">
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-title-l font-mono text-foreground">
          {formatNumber(tdee.targetCalories)}
        </span>
        <span className="text-label-m text-muted-foreground">kcal</span>
        <span className="text-label-s font-mono text-muted-foreground line-through">
          {formatNumber(tdee.tdee)}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {[
          { icon: Beef, value: `${tdee.protein}g`, label: "Protein" },
          { icon: Wheat, value: `${tdee.carbs}g`, label: "Carbs" },
          { icon: Droplet, value: `${tdee.fat}g`, label: "Fat" },
          { icon: Leaf, value: "30g", label: "Fibre" },
          { icon: GlassWater, value: `${waterLiters}L`, label: "Water" },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-surface-container"
          >
            <Icon className="h-3 w-3 text-muted-foreground" />
            <p className="text-label-m font-mono text-foreground">{value}</p>
            <p className="text-label-s text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
