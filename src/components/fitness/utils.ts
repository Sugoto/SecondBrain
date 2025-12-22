import type { HealthStats, TDEEResult } from "./types";
import { ACTIVITY_LEVELS, RECOMP_CALORIE_ADJUSTMENT, WORKOUT_INTENSITY_FACTOR } from "./types";
import type { ActivityLevel } from "@/lib/supabase";

/**
 * Format date to YYYY-MM-DD string in local timezone
 * (Avoids UTC conversion issues with toISOString)
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate BMR using the Mifflin-St Jeor equation (more accurate than Harris-Benedict)
 * Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
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
 * @param stats - Health stats including height, weight, age, gender
 * @param multiplierOverride - Optional custom multiplier (e.g. intensity-adjusted)
 */
export function calculateTDEE(stats: HealthStats, multiplierOverride?: number): TDEEResult | null {
  const { height_cm, weight_kg, age, gender, activity_level } = stats;

  // Check all required fields
  if (!height_cm || !weight_kg || !age || !gender) {
    return null;
  }

  const bmr = calculateBMR(weight_kg, height_cm, age, gender);

  // Use override multiplier if provided, otherwise look up from activity level
  let multiplier: number;
  if (multiplierOverride !== undefined) {
    multiplier = multiplierOverride;
  } else {
    const activityData = ACTIVITY_LEVELS.find((a) => a.value === activity_level);
    multiplier = activityData?.multiplier ?? 1.2; // Default to sedentary
  }

  const tdee = bmr * multiplier;

  // Body recomposition: slight deficit for fat loss while preserving muscle
  const targetCalories = Math.round(tdee + RECOMP_CALORIE_ADJUSTMENT);

  // Calculate macros (moderate carb approach)
  // Protein: 1.6-2.2g per kg bodyweight for muscle maintenance/building
  // Fat: 25-30% of calories
  // Carbs: remaining calories
  const protein = Math.round(weight_kg * 1.8); // 1.8g per kg
  const proteinCalories = protein * 4;

  const fat = Math.round((targetCalories * 0.28) / 9); // 28% of calories from fat
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
 * Calculate activity level based on workout frequency over the last 4 weeks
 * - 0-1 workouts/week → sedentary
 * - 1-3 workouts/week → light
 * - 3-5 workouts/week → moderate
 * - 6+ workouts/week → active
 */
export function calculateActivityLevel(workoutDates: Set<string> | string[]): ActivityLevel {
  const dates = workoutDates instanceof Set ? workoutDates : new Set(workoutDates);
  
  // Count workouts in the last 4 weeks (28 days)
  const now = new Date();
  let count = 0;
  
  for (let i = 0; i < 28; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = formatLocalDate(date);
    if (dates.has(dateKey)) {
      count++;
    }
  }
  
  // Calculate average workouts per week
  const avgPerWeek = count / 4;
  
  if (avgPerWeek >= 6) return "active";
  if (avgPerWeek >= 3) return "moderate";
  if (avgPerWeek >= 1) return "light";
  return "sedentary";
}

/**
 * Get activity level info with workout frequency
 * Applies intensity factor to account for workouts being at 75% of expected intensity
 */
export function getActivityLevelInfo(workoutDates: Set<string> | string[]): {
  level: ActivityLevel;
  workoutsPerWeek: number;
  label: string;
  description: string;
  multiplier: number;
} {
  const dates = workoutDates instanceof Set ? workoutDates : new Set(workoutDates);
  
  // Count workouts in the last 4 weeks
  const now = new Date();
  let count = 0;
  
  for (let i = 0; i < 28; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = formatLocalDate(date);
    if (dates.has(dateKey)) {
      count++;
    }
  }
  
  const avgPerWeek = count / 4;
  const level = calculateActivityLevel(dates);
  const levelInfo = ACTIVITY_LEVELS.find(a => a.value === level) ?? ACTIVITY_LEVELS[0];
  
  // Apply intensity factor: scale the additional activity above sedentary baseline
  // Sedentary multiplier is the baseline (1.2)
  const sedentaryMultiplier = ACTIVITY_LEVELS[0].multiplier; // 1.2
  const extraActivity = levelInfo.multiplier - sedentaryMultiplier;
  const adjustedMultiplier = sedentaryMultiplier + (extraActivity * WORKOUT_INTENSITY_FACTOR);
  
  return {
    level,
    workoutsPerWeek: Math.round(avgPerWeek * 10) / 10,
    label: levelInfo.label,
    description: levelInfo.description,
    multiplier: Math.round(adjustedMultiplier * 1000) / 1000, // Round to 3 decimal places
  };
}

