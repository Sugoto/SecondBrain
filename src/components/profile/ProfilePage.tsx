import { useEffect, useState } from "react";
import {
  Armchair,
  ChevronLeft,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Footprints,
  HeartPulse,
  LogOut,
  Mail,
  Mars,
  Minus,
  Moon,
  PiggyBank,
  Sun,
  TrendingDown,
  TrendingUp,
  Venus,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePrivacy } from "@/hooks/usePrivacy";
import { useUserStats } from "@/hooks/useExpenseData";
import { Input } from "@/components/ui/input";
import { supabase, type UserStats, type ActivityLevel } from "@/lib/supabase";
import {
  ACTIVITY_LEVELS,
  CALORIE_PRESETS,
} from "@/components/fitness/types";

const ACTIVITY_ICONS = {
  sedentary: Armchair,
  light: Footprints,
  moderate: Dumbbell,
  heavy: Flame,
} as const;

const GOAL_ICONS: Record<number, typeof TrendingDown> = {
  [-25]: TrendingDown,
  [-10]: Minus,
  [15]: TrendingUp,
};
import { cn } from "@/lib/utils";

interface ProfilePageProps {
  onGoHome: () => void;
}

type FormState = {
  bank_savings: number;
  mutual_funds: number;
  ppf: number;
  epf: number;
  monthly_income: number;
  needs_budget: number;
  wants_budget: number;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | null;
  activity_level: ActivityLevel | null;
  calorie_adjustment: number;
};

const EMPTY_FORM: FormState = {
  bank_savings: 0,
  mutual_funds: 0,
  ppf: 0,
  epf: 0,
  monthly_income: 0,
  needs_budget: 0,
  wants_budget: 0,
  height_cm: null,
  weight_kg: null,
  age: null,
  gender: null,
  activity_level: null,
  calorie_adjustment: 0,
};

function fromUserStats(stats: UserStats | null | undefined): FormState {
  if (!stats) return EMPTY_FORM;
  return {
    bank_savings: stats.bank_savings,
    mutual_funds: stats.mutual_funds,
    ppf: stats.ppf,
    epf: stats.epf,
    monthly_income: stats.monthly_income ?? 0,
    needs_budget: stats.needs_budget ?? 0,
    wants_budget: stats.wants_budget ?? 0,
    height_cm: stats.height_cm,
    weight_kg: stats.weight_kg,
    age: stats.age,
    gender: stats.gender,
    activity_level: stats.activity_level,
    calorie_adjustment: stats.calorie_adjustment,
  };
}

const numberInputClass =
  "font-mono h-9 text-body-m text-right bg-surface-container-low border border-outline-variant rounded-lg";

const sectionHeaderClass =
  "flex items-center gap-2 text-title-s text-foreground px-1";

export function ProfilePage({ onGoHome }: ProfilePageProps) {
  const { session, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { hidden, toggle: togglePrivacy } = usePrivacy();
  const { userStats, updateUserStats } = useUserStats();
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const stats = userStats ?? null;

  useEffect(() => {
    setForm(fromUserStats(stats));
  }, [
    stats?.bank_savings,
    stats?.mutual_funds,
    stats?.ppf,
    stats?.epf,
    stats?.monthly_income,
    stats?.needs_budget,
    stats?.wants_budget,
    stats?.height_cm,
    stats?.weight_kg,
    stats?.age,
    stats?.gender,
    stats?.activity_level,
    stats?.calorie_adjustment,
    stats?.id,
  ]);

  const baseline = fromUserStats(stats);
  const isDirty = (Object.keys(form) as Array<keyof FormState>).some(
    (k) => form[k] !== baseline[k],
  );

  const handleSave = async () => {
    if (!stats?.id || !isDirty) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_stats")
        .update(form)
        .eq("id", stats.id);
      if (error) throw error;
      const merged: UserStats = { ...stats, ...form };
      updateUserStats(merged);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const setNumber = (key: keyof FormState) => (value: string) => {
    const parsed = value === "" ? 0 : parseFloat(value);
    setForm((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? 0 : parsed }));
  };

  const setNullableNumber =
    (key: "height_cm" | "weight_kg" | "age") => (value: string) => {
      setForm((prev) => ({
        ...prev,
        [key]: value === "" ? null : parseFloat(value) || null,
      }));
    };

  const email = session?.user?.email ?? "";

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 vercel-header pb-3">
        <div className="flex h-[72px] flex-col px-4 pt-2 pb-1.5">
          <div className="mb-1.5 flex min-h-8 items-center gap-2">
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Back to home"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <h1 className="flex-1 text-title-m text-foreground truncate">
              Profile
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3 min-h-0">
        <section className="shrink-0 bg-card border border-outline-variant rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-label-s text-muted-foreground">Signed in as</p>
              <p className="text-body-l text-foreground truncate flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{email || "Unknown"}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-red-100 hover:bg-red-100/80 text-red-700 dark:bg-red-950/50 dark:hover:bg-red-950/40 dark:text-red-300 transition-colors active:scale-95 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="shrink-0 bg-card border border-outline-variant rounded-2xl flex items-stretch overflow-hidden">
          <button
            type="button"
            onClick={togglePrivacy}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            aria-pressed={hidden}
            className="flex-1 flex items-center justify-center py-4 transition-colors active:scale-95"
          >
            {hidden ? (
              <EyeOff className="h-5 w-5 text-foreground" />
            ) : (
              <Eye className="h-5 w-5 text-foreground" />
            )}
          </button>
          <div className="w-px bg-outline-variant" />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            className="flex-1 flex items-center justify-center py-4 transition-colors active:scale-95"
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-foreground" />
            )}
          </button>
        </section>

        <section className="shrink-0 bg-card border border-outline-variant rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className={sectionHeaderClass}>
            <Wallet className="h-4 w-4" />
            <span>Assets</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { key: "bank_savings", label: "Bank Savings" },
              { key: "mutual_funds", label: "Mutual Funds" },
              { key: "ppf", label: "PPF" },
              { key: "epf", label: "EPF" },
              { key: "monthly_income", label: "Monthly Salary" },
            ].map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <label className="text-label-m text-muted-foreground flex-1 truncate">
                  {row.label}
                </label>
                <Input
                  type="number"
                  value={form[row.key as keyof FormState] as number}
                  onChange={(e) =>
                    setNumber(row.key as keyof FormState)(e.target.value)
                  }
                  className={cn(numberInputClass, "w-44")}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="shrink-0 bg-card border border-outline-variant rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className={sectionHeaderClass}>
            <PiggyBank className="h-4 w-4" />
            <span>Budgets</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { key: "needs_budget", label: "Needs" },
              { key: "wants_budget", label: "Wants" },
            ].map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <label className="text-label-m text-muted-foreground flex-1 truncate">
                  {row.label}
                </label>
                <Input
                  type="number"
                  value={form[row.key as keyof FormState] as number}
                  onChange={(e) =>
                    setNumber(row.key as keyof FormState)(e.target.value)
                  }
                  className={cn(numberInputClass, "w-44")}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="shrink-0 bg-card border border-outline-variant rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className={sectionHeaderClass}>
            <HeartPulse className="h-4 w-4" />
            <span>Health profile</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Height (cm)
              </label>
              <Input
                type="number"
                value={form.height_cm ?? ""}
                onChange={(e) => setNullableNumber("height_cm")(e.target.value)}
                placeholder="175"
                className={cn(numberInputClass, "w-44")}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Weight (kg)
              </label>
              <Input
                type="number"
                value={form.weight_kg ?? ""}
                onChange={(e) => setNullableNumber("weight_kg")(e.target.value)}
                placeholder="70"
                className={cn(numberInputClass, "w-44")}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Age
              </label>
              <Input
                type="number"
                value={form.age ?? ""}
                onChange={(e) => setNullableNumber("age")(e.target.value)}
                placeholder="25"
                className={cn(numberInputClass, "w-44")}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Sex
              </label>
              <div className="flex items-center bg-surface-container rounded-full p-0.5 w-44">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, gender: "male" }))
                  }
                  aria-label="Male"
                  aria-pressed={form.gender === "male"}
                  className={cn(
                    "flex-1 h-8 rounded-full flex items-center justify-center transition-colors",
                    form.gender === "male"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Mars className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, gender: "female" }))
                  }
                  aria-label="Female"
                  aria-pressed={form.gender === "female"}
                  className={cn(
                    "flex-1 h-8 rounded-full flex items-center justify-center transition-colors",
                    form.gender === "female"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Venus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Activity level
              </label>
              <div className="flex items-center bg-surface-container rounded-full p-0.5 w-44">
                {ACTIVITY_LEVELS.map((level) => {
                  const Icon = ACTIVITY_ICONS[level.value];
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          activity_level: level.value,
                        }))
                      }
                      aria-label={level.label}
                      aria-pressed={form.activity_level === level.value}
                      title={level.label}
                      className={cn(
                        "flex-1 h-8 rounded-full flex items-center justify-center transition-colors",
                        form.activity_level === level.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-label-m text-muted-foreground flex-1 truncate">
                Goal
              </label>
              <div className="flex items-center bg-surface-container rounded-full p-0.5 w-44">
                {CALORIE_PRESETS.map((preset) => {
                  const Icon = GOAL_ICONS[preset.value] ?? Minus;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          calorie_adjustment: preset.value,
                        }))
                      }
                      aria-label={preset.description}
                      aria-pressed={form.calorie_adjustment === preset.value}
                      title={preset.description}
                      className={cn(
                        "flex-1 h-8 rounded-full flex items-center justify-center transition-colors",
                        form.calorie_adjustment === preset.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="shrink-0 px-4 pt-3 pb-4 bg-background">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl px-5 py-4 transition-colors active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100"
        >
          <span className="text-body-l font-medium">
            {saving ? "Saving…" : "Save changes"}
          </span>
        </button>
      </footer>
    </div>
  );
}
