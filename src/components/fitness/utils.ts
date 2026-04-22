import type { HealthStats, TDEEResult } from "./types";
import { ACTIVITY_LEVELS, RECOMP_CALORIE_ADJUSTMENT } from "./types";

/**
 * Calculate BMR using the Mifflin-St Jeor equation
 */
function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: "male" | "female",
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/**
 * Calculate TDEE and macro recommendations
 */
export function calculateTDEE(
  stats: HealthStats,
  multiplierOverride?: number,
): TDEEResult | null {
  const { height_cm, weight_kg, age, gender, activity_level } = stats;

  if (!height_cm || !weight_kg || !age || !gender) {
    return null;
  }

  const bmr = calculateBMR(weight_kg, height_cm, age, gender);

  let multiplier: number;
  if (multiplierOverride !== undefined) {
    multiplier = multiplierOverride;
  } else {
    const activityData = ACTIVITY_LEVELS.find(
      (a) => a.value === activity_level,
    );
    multiplier = activityData?.multiplier ?? 1.2;
  }

  const tdee = bmr * multiplier;
  const targetCalories = Math.round(tdee + RECOMP_CALORIE_ADJUSTMENT);

  const protein = Math.round(weight_kg * 1.8);
  const proteinCalories = protein * 4;

  const fat = Math.round((targetCalories * 0.28) / 9);
  const fatCalories = fat * 9;

  const carbs = Math.round(
    (targetCalories - proteinCalories - fatCalories) / 4,
  );

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    protein,
    carbs,
    fat,
  };
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}
