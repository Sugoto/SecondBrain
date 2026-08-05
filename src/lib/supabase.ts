import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id: string;
  amount: number;
  merchant: string | null;
  date: string;
  time: string | null;
  value_rating: number | null; // 1-5, how worth-it the purchase felt
  excluded_from_budget: boolean;
  details: string | null;
  created_at: string;
  prorate_months: number | null;
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

export type UserStats = {
  id: string;
  bank_savings: number;
  mutual_funds: number;
  us_etfs: number;
  ppf: number;
  epf: number;
  monthly_income: number | null;
  monthly_budget: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: ActivityLevel | null;
  calorie_adjustment: number;
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

export type Workout = {
  id: string;
  name: string;
  max_weight: number;
  session: "push" | "pull" | "legs";
  muscle_group: string | null;
  created_at: string;
  updated_at: string;
};
