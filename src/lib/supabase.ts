import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BudgetType = "need" | "want";

export type Transaction = {
  id: string;
  amount: number;
  merchant: string | null;
  date: string;
  time: string | null;
  category: string | null;
  excluded_from_budget: boolean;
  details: string | null;
  created_at: string;
  prorate_months: number | null;
  budget_type: BudgetType | null; // null = auto-assign based on category
};

export type Investment = {
  id: string;
  schemeCode: number;
  amount: number;
  date: string;
  nav: number;
  units: number;
};

export type ActivityLevel = "sedentary" | "light" | "moderate" | "heavy";

// Activity log: date -> activity level
export type ActivityLog = Record<string, ActivityLevel>;

export type UserStats = {
  id: string;
  bank_savings: number;
  fixed_deposits: number;
  mutual_funds: number;
  ppf: number;
  epf: number;
  monthly_income: number | null;
  needs_budget: number | null; // Monthly budget for needs
  wants_budget: number | null; // Monthly budget for wants
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: ActivityLevel | null;
  activity_log: ActivityLog | null;
  manual_activity_dates: string[] | null; // Dates with manual entries
  workout_dates: string[] | null; // Dates with gym workouts marked
  investments: Investment[] | null;
};

export type ShoppingItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  cost: number;
  weight_grams: number; // Weight in grams for the given cost/nutrition values
  serving_grams: number; // Serving size in grams
  checked: boolean;
  created_at: string;
};

export type OmscsCourseDetails = {
  analysis?: string;
  pros?: string[];
  cons?: string[];
  [key: string]: unknown;
};

export type OmscsCourse = {
  id: string;
  code: string;
  name: string;
  enrolled_semester: string | null;
  final_grade: string | null;
  details: OmscsCourseDetails | null;
  created_at: string;
};
