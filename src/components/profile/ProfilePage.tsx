import { useEffect, useState } from "react";
import {
  Armchair,
  ChevronLeft,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Footprints,
  LogOut,
  Mars,
  Minus,
  Moon,
  Sun,
  TrendingDown,
  TrendingUp,
  Venus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePrivacy } from "@/hooks/usePrivacy";
import { useUserStats } from "@/hooks/useExpenseData";
import { supabase, type UserStats, type ActivityLevel } from "@/lib/supabase";
import {
  ACTIVITY_LEVELS,
  CALORIE_PRESETS,
} from "@/components/fitness/types";
import { cn } from "@/lib/utils";

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

interface ProfilePageProps {
  onGoHome: () => void;
}

type FormState = {
  bank_savings: number;
  mutual_funds: number;
  us_etfs: number;
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
  us_etfs: 0,
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
    us_etfs: stats.us_etfs ?? 0,
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

const EYEBROW = "text-[10px] uppercase tracking-wider text-muted-foreground";
const SECTION_LABEL = "text-[10px] uppercase tracking-wider text-foreground";

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-outline-variant/60 last:border-b-0">
      <label className="text-[13px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: number | string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="font-mono tabular-nums text-right text-[15px] text-foreground bg-transparent outline-none w-32 placeholder:text-muted-foreground/40"
    />
  );
}

type SegmentOption<T extends string | number> = {
  value: T;
  icon: typeof TrendingDown;
  ariaLabel: string;
};

function Segmented<T extends string | number>({
  options,
  active,
  onChange,
}: {
  options: SegmentOption<T>[];
  active: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid border-y border-outline-variant divide-x divide-outline-variant w-44"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = active === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-label={opt.ariaLabel}
            aria-pressed={selected}
            className={cn(
              "h-9 flex items-center justify-center transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

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
    stats?.us_etfs,
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
    <div className="h-full flex flex-col bg-background">
      <header className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Back to home"
            className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className={EYEBROW}>Profile</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={togglePrivacy}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            aria-pressed={hidden}
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            {hidden ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" strokeWidth={1.5} /> : <Sun className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto min-h-0">
        <section className="px-6 pt-4 pb-6 border-b border-outline-variant">
          <p className={`${EYEBROW} mb-3`}>Account</p>
          <div className="flex items-center gap-3">
            <p className="flex-1 min-w-0 text-[15px] text-foreground truncate">
              {email || "Unknown"}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="text-destructive hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-50 shrink-0"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </section>

        <section className="px-6 pt-7 pb-2 border-b border-outline-variant">
          <p className={`${SECTION_LABEL} mb-1`}>Assets</p>
          {[
            { key: "bank_savings", label: "Bank Savings" },
            { key: "mutual_funds", label: "IND Mutual Funds" },
            { key: "us_etfs", label: "US ETFs" },
            { key: "ppf", label: "PPF" },
            { key: "epf", label: "EPF" },
            { key: "monthly_income", label: "Monthly Salary" },
          ].map((row) => (
            <Field key={row.key} label={row.label}>
              {hidden ? (
                <span className="font-mono tabular-nums text-right text-[14px] text-muted-foreground/60 w-32">
                  ₹•••
                </span>
              ) : (
                <NumberField
                  value={form[row.key as keyof FormState] as number}
                  onChange={setNumber(row.key as keyof FormState)}
                />
              )}
            </Field>
          ))}
        </section>

        <section className="px-6 pt-7 pb-2 border-b border-outline-variant">
          <p className={`${SECTION_LABEL} mb-1`}>Budgets</p>
          {[
            { key: "needs_budget", label: "Needs" },
            { key: "wants_budget", label: "Wants" },
          ].map((row) => (
            <Field key={row.key} label={row.label}>
              <NumberField
                value={form[row.key as keyof FormState] as number}
                onChange={setNumber(row.key as keyof FormState)}
              />
            </Field>
          ))}
        </section>

        <section className="px-6 pt-7 pb-10 border-b border-outline-variant">
          <p className={`${SECTION_LABEL} mb-1`}>Health</p>
          <Field label="Height (cm)">
            <NumberField
              value={form.height_cm ?? ""}
              onChange={setNullableNumber("height_cm")}
              placeholder="175"
            />
          </Field>
          <Field label="Weight (kg)">
            <NumberField
              value={form.weight_kg ?? ""}
              onChange={setNullableNumber("weight_kg")}
              placeholder="70"
            />
          </Field>
          <Field label="Age">
            <NumberField
              value={form.age ?? ""}
              onChange={setNullableNumber("age")}
              placeholder="25"
            />
          </Field>
          <Field label="Sex">
            <Segmented
              active={form.gender}
              onChange={(v) => setForm((prev) => ({ ...prev, gender: v }))}
              options={[
                { value: "male", icon: Mars, ariaLabel: "Male" },
                { value: "female", icon: Venus, ariaLabel: "Female" },
              ]}
            />
          </Field>
          <Field label="Activity">
            <Segmented
              active={form.activity_level}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, activity_level: v }))
              }
              options={ACTIVITY_LEVELS.map((l) => ({
                value: l.value,
                icon: ACTIVITY_ICONS[l.value],
                ariaLabel: l.label,
              }))}
            />
          </Field>
          <Field label="Goal">
            <Segmented
              active={form.calorie_adjustment}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, calorie_adjustment: v }))
              }
              options={CALORIE_PRESETS.map((p) => ({
                value: p.value,
                icon: GOAL_ICONS[p.value] ?? Minus,
                ariaLabel: p.description,
              }))}
            />
          </Field>
        </section>

        <div className="h-32" aria-hidden="true" />
      </main>

      <footer
        className="fixed left-0 right-0 bottom-0 z-30 px-6 pt-3 bg-background border-t border-outline-variant"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full h-12 flex items-center justify-center bg-foreground text-background text-[13px] uppercase tracking-wider rounded-lg transition-opacity active:opacity-90 disabled:opacity-30"
        >
          {saving ? "Saving" : isDirty ? "Save changes" : "No changes to save"}
        </button>
      </footer>
    </div>
  );
}
