import type { ActivityLevel } from "@/lib/supabase";

export interface HealthStats {
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: ActivityLevel | null;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export const ACTIVITY_LEVELS: {
  value: ActivityLevel;
  label: string;
  description: string;
  multiplier: number;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little or no exercise",
    multiplier: 1.2,
  },
  {
    value: "light",
    label: "Gentle",
    description: "1-3 days/week",
    multiplier: 1.375,
  },
  {
    value: "moderate",
    label: "Light",
    description: "3-5 days/week",
    multiplier: 1.55,
  },
  {
    value: "active",
    label: "Moderate",
    description: "6-7 days/week",
    multiplier: 1.725,
  },
];

export const RECOMP_CALORIE_ADJUSTMENT = -500;

export const WORKOUT_INTENSITY_FACTOR = 0.75;
