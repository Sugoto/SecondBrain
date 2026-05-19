import { useMemo } from "react";
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

  const activity = tdee.tdee - tdee.bmr;
  const adjustment = tdee.targetCalories - tdee.tdee;
  const adjustmentLabel =
    adjustment === 0 ? "Maintain" : adjustment > 0 ? "Surplus" : "Deficit";

  const breakdown = [
    { value: tdee.bmr, label: "BMR", sign: "" },
    { value: activity, label: "Activity", sign: "+" },
    {
      value: Math.abs(adjustment),
      label: adjustmentLabel,
      sign: adjustment === 0 ? "" : adjustment > 0 ? "+" : "−",
    },
  ];

  const macros = [
    { value: `${tdee.protein}`, unit: "g", label: "Protein" },
    { value: `${tdee.carbs}`, unit: "g", label: "Carbs" },
    { value: `${tdee.fat}`, unit: "g", label: "Fat" },
    { value: `30`, unit: "g", label: "Fibre" },
    { value: `${waterLiters}`, unit: "L", label: "Water" },
  ];

  return (
    <section className="px-6 pt-7 pb-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
        Nutrition
      </p>

      <div className="flex items-baseline gap-2 mb-5">
        <span className="font-mono tabular-nums tracking-[-0.04em] text-foreground leading-[0.9] text-[clamp(44px,13vw,64px)]">
          {formatNumber(tdee.targetCalories)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground ml-1">
          kcal
        </span>
      </div>

      <div className="grid grid-cols-3 border-y border-outline-variant/60 mb-5">
        {breakdown.map(({ value, label, sign }, i) => (
          <div
            key={label}
            className={`flex flex-col gap-1.5 px-2 py-3 ${
              i > 0 ? "border-l border-outline-variant/60" : ""
            }`}
          >
            <p className="font-mono tabular-nums text-foreground text-[15px] leading-none">
              {sign && (
                <span
                  className={`mr-0.5 ${
                    sign === "+" ? "text-success" : "text-destructive"
                  }`}
                >
                  {sign}
                </span>
              )}
              {formatNumber(value)}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 border-y border-outline-variant/60">
        {macros.map(({ value, unit, label }, i) => (
          <div
            key={label}
            className={`flex flex-col gap-1.5 px-2 py-3 ${
              i > 0 ? "border-l border-outline-variant/60" : ""
            }`}
          >
            <p className="font-mono tabular-nums text-foreground text-[15px] leading-none">
              {value}
              <span className="text-muted-foreground/60 text-[11px] ml-0.5">{unit}</span>
            </p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
