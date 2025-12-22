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
  type: "expense" | "income";
  account: string | null;
  upi_ref: string | null;
  category: string | null;
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

export type UserStats = {
  id: string;
  bank_savings: number;
  fixed_deposits: number;
  mutual_funds: number;
  ppf: number;
  epf: number;
  monthly_income: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | null;
  workout_dates: string[] | null;
  investments: Investment[] | null;
};

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
