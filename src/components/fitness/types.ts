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
    description: "<2k steps",
    multiplier: 1.2,
    color: "#6b7280", // gray
  },
  {
    value: "light",
    label: "Light",
    description: "<5k steps, no gym",
    multiplier: 1.375,
    color: "#eab308", // yellow
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "5-10k steps + gym",
    multiplier: 1.55,
    color: "#3b82f6", // blue
  },
  {
    value: "heavy",
    label: "Heavy",
    description: "10k+ steps + intense gym",
    multiplier: 1.725,
    color: "#f97316", // fiery orange
  },
];

export const RECOMP_CALORIE_ADJUSTMENT = -500;
