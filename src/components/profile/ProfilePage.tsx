import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePrivacy } from "@/hooks/usePrivacy";
import { useUserStats } from "@/hooks/useExpenseData";
import { supabase, type UserStats, type ActivityLevel } from "@/lib/supabase";
import { ACTIVITY_LEVELS, CALORIE_PRESETS } from "@/components/fitness/types";
import { cn } from "@/lib/utils";

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
  monthly_budget: number;
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
  monthly_budget: 0,
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
    monthly_budget: stats.monthly_budget ?? 0,
    height_cm: stats.height_cm,
    weight_kg: stats.weight_kg,
    age: stats.age,
    gender: stats.gender,
    activity_level: stats.activity_level,
    calorie_adjustment: stats.calorie_adjustment,
  };
}

/** Identity of the server value, so a change to any tracked field re-seeds the
 *  form. Mirrors the field list in `fromUserStats`. */
function statsKey(stats: UserStats | null | undefined): string {
  if (!stats) return "";
  const f = fromUserStats(stats);
  return [stats.id, ...(Object.keys(f) as Array<keyof FormState>).map((k) => f[k])].join("|");
}

const SECTION_LABEL = "text-[13px] font-medium text-[var(--ui-accent)]";
const CAPTION = "text-[12px] text-[var(--ui-ink-softer)]";

const ASSET_ROWS = [
  { key: "bank_savings", label: "Bank savings" },
  { key: "mutual_funds", label: "Indian mutual funds" },
  { key: "us_etfs", label: "US ETFs" },
  { key: "ppf", label: "PPF" },
  { key: "epf", label: "EPF" },
  { key: "monthly_income", label: "Monthly salary" },
] as const;

/** One ruled row inside a panel. The last row closes the panel, so it drops
 *  its rule rather than drawing one against the panel edge. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--ui-rule)] px-4 py-2.5 last:border-b-0">
      <span className="min-w-0 truncate text-[14px] text-[var(--ui-ink)]">{label}</span>
      {children}
    </div>
  );
}

/** Right-aligned numeric entry. `prefix`/`suffix` carry the unit so it stays
 *  out of the label. */
function NumberField({
  id,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  ariaLabel,
}: {
  id: string;
  value: number | string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  ariaLabel: string;
}) {
  return (
    <span className="ui-inset flex h-9 items-center gap-1 px-2.5 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]">
      {prefix && <span className="ui-num text-[13px] text-[var(--ui-ink-softer)]">{prefix}</span>}
      <input
        id={id}
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-num w-24 bg-transparent text-right text-[14px] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)]"
      />
      {suffix && <span className={`${CAPTION} w-6 shrink-0`}>{suffix}</span>}
    </span>
  );
}

/** The documented segmented control: an inset track, the selected segment
 *  raised onto the panel colour. */
function Segmented<T extends string | number>({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  active: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className={CAPTION}>{label}</span>
      <div
        role="group"
        aria-label={label}
        className="ui-inset mt-1.5 grid gap-1 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const selected = active === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-9 truncate rounded-[7px] px-1 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)]",
                selected
                  ? "bg-[var(--ui-panel)] font-medium text-[var(--ui-accent)] shadow-[var(--ui-lift)]"
                  : "text-[var(--ui-ink-softer)] hover:text-[var(--ui-ink)]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfilePage({ onGoHome }: ProfilePageProps) {
  const { session, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { hidden, toggle: togglePrivacy } = usePrivacy();
  const { userStats, updateUserStats } = useUserStats();
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stats = userStats ?? null;
  const baseline = fromUserStats(stats);

  const [form, setForm] = useState<FormState>(baseline);
  const [syncedTo, setSyncedTo] = useState<string>(() => statsKey(stats));

  /* Re-seed the form when the server value changes, compared during render
     rather than in an effect: setState inside an effect body cascades a second
     render, and `vp check` rejects it. Same idiom as TransactionDialog. */
  const currentKey = statsKey(stats);
  if (currentKey !== syncedTo) {
    setSyncedTo(currentKey);
    setForm(baseline);
  }

  const isDirty = (Object.keys(form) as Array<keyof FormState>).some(
    (k) => form[k] !== baseline[k],
  );

  const handleSave = async () => {
    if (!stats?.id || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase.from("user_stats").update(form).eq("id", stats.id);
      if (error) throw error;
      const merged: UserStats = { ...stats, ...form };
      updateUserStats(merged);
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveError("Could not save. Check your connection and try again.");
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

  const setNullableNumber = (key: "height_cm" | "weight_kg" | "age") => (value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? null : parseFloat(value) || null,
    }));
  };

  const email = session?.user?.email ?? "";

  return (
    <div className="ui-surface flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-1.5 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Back to home"
          className="-ml-2 shrink-0 rounded-lg p-2.5 text-[var(--ui-ink-softer)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)] active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[var(--ui-ink)]">
          Profile
        </h1>
      </header>

      <main className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4">
        {/* Identity, on the same dark plate as the home masthead. */}
        <section className="ui-plate flex items-center gap-3 rounded-[14px] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--ui-plate-ink-soft)]">Signed in as</p>
            <p className="truncate text-[15px] text-[var(--ui-plate-ink)]">{email || "Unknown"}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--ui-plate-edge)] px-3 text-[13px] text-[var(--ui-plate-ink-soft)] transition-colors hover:text-[var(--ui-plate-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-plate-ink)] active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            {signingOut ? "Leaving" : "Sign out"}
          </button>
        </section>

        <section>
          <h2 className={SECTION_LABEL}>Appearance</h2>
          <div className="mt-2 space-y-3">
            <Segmented
              label="Theme"
              active={theme}
              onChange={setTheme}
              options={[
                { value: "light" as const, label: "Light" },
                { value: "dark" as const, label: "Dark" },
              ]}
            />
            <button
              type="button"
              onClick={togglePrivacy}
              aria-pressed={hidden}
              className="ui-panel flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ui-inset)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ui-accent)]"
            >
              <span className="min-w-0">
                <span className="block text-[14px] text-[var(--ui-ink)]">Hide amounts</span>
                <span className={`${CAPTION} block`}>
                  {hidden ? "Net worth and salary are masked" : "Everything is visible"}
                </span>
              </span>
              <span
                className={cn(
                  "ui-chip h-8 shrink-0 px-3 text-[12px]",
                  hidden ? "" : "ui-chip-quiet",
                )}
              >
                {hidden ? (
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
                {hidden ? "Hidden" : "Shown"}
              </span>
            </button>
          </div>
        </section>

        <section>
          <h2 className={SECTION_LABEL}>Assets</h2>
          <div className="ui-panel mt-2 overflow-hidden">
            {ASSET_ROWS.map((row) => (
              <Row key={row.key} label={row.label}>
                {hidden ? (
                  <span className="ui-inset ui-num flex h-9 items-center px-2.5 text-[13px] text-[var(--ui-ink-softer)]">
                    ₹•••
                  </span>
                ) : (
                  <NumberField
                    id={`asset-${row.key}`}
                    ariaLabel={row.label}
                    prefix="₹"
                    value={form[row.key] as number}
                    onChange={setNumber(row.key)}
                  />
                )}
              </Row>
            ))}
          </div>
        </section>

        {/* Budget gets one emphasised figure rather than another ruled panel,
            so the page is legible by shape and not only by heading. */}
        <section>
          <h2 className={SECTION_LABEL}>Budget</h2>
          <label
            htmlFor="monthly-budget"
            className="ui-inset mt-2 flex items-center gap-2 px-4 py-4 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
          >
            <span className="ui-num text-[22px] leading-none text-[var(--ui-ink-softer)]">₹</span>
            <input
              id="monthly-budget"
              type="number"
              inputMode="decimal"
              value={form.monthly_budget}
              onChange={(e) => setNumber("monthly_budget")(e.target.value)}
              className="ui-num min-w-0 flex-1 bg-transparent text-[28px] leading-none tracking-[-0.02em] text-[var(--ui-ink)] outline-none"
            />
            <span className={`${CAPTION} shrink-0`}>per month</span>
          </label>
        </section>

        <section>
          <h2 className={SECTION_LABEL}>Health</h2>
          <div className="ui-panel mt-2 overflow-hidden">
            <Row label="Height">
              <NumberField
                id="height"
                ariaLabel="Height in centimetres"
                suffix="cm"
                value={form.height_cm ?? ""}
                onChange={setNullableNumber("height_cm")}
                placeholder="175"
              />
            </Row>
            <Row label="Weight">
              <NumberField
                id="weight"
                ariaLabel="Weight in kilograms"
                suffix="kg"
                value={form.weight_kg ?? ""}
                onChange={setNullableNumber("weight_kg")}
                placeholder="70"
              />
            </Row>
            <Row label="Age">
              <NumberField
                id="age"
                ariaLabel="Age in years"
                suffix="yrs"
                value={form.age ?? ""}
                onChange={setNullableNumber("age")}
                placeholder="25"
              />
            </Row>
          </div>

          <div className="mt-3 space-y-3">
            <Segmented
              label="Sex"
              active={form.gender}
              onChange={(v) => setForm((prev) => ({ ...prev, gender: v }))}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
            <Segmented
              label="Activity"
              active={form.activity_level}
              onChange={(v) => setForm((prev) => ({ ...prev, activity_level: v }))}
              options={ACTIVITY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
            />
            <Segmented
              label="Goal"
              active={form.calorie_adjustment}
              onChange={(v) => setForm((prev) => ({ ...prev, calorie_adjustment: v }))}
              options={CALORIE_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>
        </section>

        <div className="h-32" aria-hidden="true" />
      </main>

      <footer
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--ui-edge)] bg-[var(--ui-page)] px-4 pt-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)" }}
      >
        {saveError && (
          <p role="alert" className="mb-2 text-[13px] text-[var(--ui-danger)]">
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)] active:opacity-90",
            isDirty || saving
              ? "ui-cta"
              : "border border-[var(--ui-edge)] bg-transparent text-[var(--ui-ink-softer)]",
          )}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving" : isDirty ? "Save changes" : "Nothing to save yet"}
        </button>
      </footer>
    </div>
  );
}
