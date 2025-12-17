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
    label: "Light",
    description: "1-3 days/week",
    multiplier: 1.375,
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "3-5 days/week",
    multiplier: 1.55,
  },
  {
    value: "active",
    label: "Heavy",
    description: "6-7 days/week",
    multiplier: 1.725,
  },
];

// Fixed goal: Body recomposition (lose fat + gain muscle)
// Uses a 500 kcal deficit with high protein for muscle preservation
export const RECOMP_CALORIE_ADJUSTMENT = -500;

