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
  color: string;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little to no exercise",
    multiplier: 1.2,
    color: "#a3a3a3",
  },
  {
    value: "light",
    label: "Light",
    description: "Light activity, no gym",
    multiplier: 1.375,
    color: "#737373",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Regular gym sessions",
    multiplier: 1.55,
    color: "#525252",
  },
  {
    value: "heavy",
    label: "Heavy",
    description: "Intense daily training",
    multiplier: 1.725,
    color: "#262626",
  },
];

export const RECOMP_CALORIE_ADJUSTMENT = -500;
