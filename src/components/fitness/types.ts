import type { ActivityLevel } from "@/lib/supabase";

export interface HealthStats {
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: ActivityLevel | null;
  calorie_adjustment: number;
}

export const CALORIE_PRESETS = [
  { value: -25, label: "Lose", description: "Weight loss" },
  { value: -10, label: "Recomp", description: "Recomp" },
  { value: 15, label: "Gain", description: "Muscle gain" },
] as const;

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

