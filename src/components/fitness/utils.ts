import type { HealthStats, TDEEResult } from "./types";
import { ACTIVITY_LEVELS, RECOMP_CALORIE_ADJUSTMENT } from "./types";
import type { ActivityLevel, ActivityLog } from "@/lib/supabase";

/**
 * Format date to YYYY-MM-DD string in local timezone
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Multiplier weights for each level
const LEVEL_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

/**
 * Calculate BMR using the Mifflin-St Jeor equation
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: "male" | "female"
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/**
 * Calculate TDEE and macro recommendations
 */
export function calculateTDEE(stats: HealthStats, multiplierOverride?: number): TDEEResult | null {
  const { height_cm, weight_kg, age, gender, activity_level } = stats;

  if (!height_cm || !weight_kg || !age || !gender) {
    return null;
  }

  const bmr = calculateBMR(weight_kg, height_cm, age, gender);

  let multiplier: number;
  if (multiplierOverride !== undefined) {
    multiplier = multiplierOverride;
  } else {
    const activityData = ACTIVITY_LEVELS.find((a) => a.value === activity_level);
    multiplier = activityData?.multiplier ?? 1.2;
  }

  const tdee = bmr * multiplier;
  const targetCalories = Math.round(tdee + RECOMP_CALORIE_ADJUSTMENT);

  const protein = Math.round(weight_kg * 1.8);
  const proteinCalories = protein * 4;

  const fat = Math.round((targetCalories * 0.28) / 9);
  const fatCalories = fat * 9;

  const carbs = Math.round((targetCalories - proteinCalories - fatCalories) / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    protein,
    carbs,
    fat,
  };
}

/**
 * Calculate BMI
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return weight_kg / (height_m * height_m);
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): {
  category: string;
  color: string;
} {
  if (bmi < 18.5) return { category: "Underweight", color: "#3b82f6" };
  if (bmi < 25) return { category: "Normal", color: "#22c55e" };
  if (bmi < 30) return { category: "Overweight", color: "#f59e0b" };
  return { category: "Obese", color: "#ef4444" };
}

/**
 * Format number with comma separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

/**
 * Calculate average activity level based on activity log over the last 4 weeks
 * Returns weighted average multiplier based on logged activity levels
 */
export function getActivityLevelInfo(activityLog: ActivityLog): {
  level: ActivityLevel;
  activeDays: number;
  label: string;
  description: string;
  multiplier: number;
} {
  const now = new Date();
  let totalMultiplier = 0;
  let loggedDays = 0;
  
  for (let i = 0; i < 28; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = formatLocalDate(date);
    const level = activityLog[dateKey];
    
    if (level) {
      totalMultiplier += LEVEL_MULTIPLIERS[level];
      loggedDays++;
    } else {
      // Default to light activity for unlogged days
      totalMultiplier += LEVEL_MULTIPLIERS.light;
    }
  }
  
  const avgMultiplier = totalMultiplier / 28;
  
  // Determine overall level based on average multiplier
  let level: ActivityLevel = "sedentary";
  if (avgMultiplier >= 1.65) level = "heavy";
  else if (avgMultiplier >= 1.45) level = "moderate";
  else if (avgMultiplier >= 1.3) level = "light";
  
  const levelInfo = ACTIVITY_LEVELS.find(a => a.value === level) ?? ACTIVITY_LEVELS[0];
  
  return {
    level,
    activeDays: loggedDays,
    label: levelInfo.label,
    description: levelInfo.description,
    multiplier: Math.round(avgMultiplier * 1000) / 1000,
  };
}

