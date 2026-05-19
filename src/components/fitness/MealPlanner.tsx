import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useMaskedRupee } from "@/hooks/usePrivacy";
import type { ShoppingItem } from "@/lib/supabase";

const DEFAULT_COST = 150;
const DEFAULT_PROTEIN = 100;
const PICK_COUNT = 4;
const MIN_PICKS = 3;
const MIN_PER_ITEM_GRAMS = 10;
const DAYS_STORAGE_KEY = "meal-planner-days";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

interface PickedItem {
  item: ShoppingItem;
  grams: number;
  protein: number;
  calories: number;
  cost: number;
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = Math.abs(seed) || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function maxAchievableProtein(pool: ShoppingItem[], targetCost: number): number {
  const candidates = pool
    .filter((it) => it.protein > 0 && it.weight_grams > 0 && it.cost > 0)
    .map((it) => {
      const cap = it.serving_grams || 100;
      const proteinPerServe = (it.protein / 100) * cap;
      const costPerServe = (it.cost / it.weight_grams) * cap;
      return {
        proteinPerServe,
        costPerServe,
        ratio: proteinPerServe / costPerServe,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  let costLeft = targetCost;
  let protein = 0;
  for (const c of candidates) {
    if (costLeft <= 0) break;
    if (c.costPerServe <= costLeft) {
      protein += c.proteinPerServe;
      costLeft -= c.costPerServe;
    } else {
      const fraction = costLeft / c.costPerServe;
      protein += c.proteinPerServe * fraction;
      costLeft = 0;
    }
  }
  return protein;
}

function fillInOrder(
  ordered: ShoppingItem[],
  targetCost: number,
  targetProtein: number,
  applyContribCap: boolean,
): PickedItem[] | null {
  let remainingProtein = targetProtein;
  let remainingCost = targetCost;
  const maxContribution = applyContribCap ? targetProtein * 0.5 : Infinity;
  const allocations: { item: ShoppingItem; grams: number }[] = [];

  for (const it of ordered) {
    if (remainingProtein <= 0.001) break;
    const proteinPerGram = it.protein / 100;
    const costPerGram = it.cost / it.weight_grams;
    const cap = it.serving_grams || 100;
    const gramsForRemainingProtein = remainingProtein / proteinPerGram;
    const gramsAffordable = costPerGram > 0 ? remainingCost / costPerGram : cap;
    const gramsForContribCap = maxContribution / proteinPerGram;
    const grams = Math.min(
      cap,
      gramsForRemainingProtein,
      gramsAffordable,
      gramsForContribCap,
    );
    if (grams < MIN_PER_ITEM_GRAMS) continue;
    allocations.push({ item: it, grams });
    remainingProtein -= proteinPerGram * grams;
    remainingCost -= costPerGram * grams;
  }

  if (remainingProtein > 0.5) {
    for (const a of allocations) {
      if (remainingProtein <= 0.001) break;
      const it = a.item;
      const proteinPerGram = it.protein / 100;
      const costPerGram = it.cost / it.weight_grams;
      const cap = it.serving_grams || 100;
      const headroom = cap - a.grams;
      if (headroom <= 0) continue;
      const gramsForRemainingProtein = remainingProtein / proteinPerGram;
      const gramsAffordable = costPerGram > 0 ? remainingCost / costPerGram : headroom;
      const additional = Math.min(headroom, gramsForRemainingProtein, gramsAffordable);
      if (additional <= 0) continue;
      a.grams += additional;
      remainingProtein -= proteinPerGram * additional;
      remainingCost -= costPerGram * additional;
    }
  }

  if (remainingProtein > 0.5) return null;

  return allocations.map(({ item, grams }) => {
    const proPerG = item.protein / 100;
    const calPerG = item.calories / 100;
    const costPerG = item.cost / item.weight_grams;
    return {
      item,
      grams: Math.round(grams),
      protein: Math.round(proPerG * grams),
      calories: Math.round(calPerG * grams),
      cost: Math.round(costPerG * grams),
    };
  });
}

function byProteinPerRupeeDesc(a: ShoppingItem, b: ShoppingItem) {
  const aRatio = (a.protein / 100) / (a.cost / a.weight_grams);
  const bRatio = (b.protein / 100) / (b.cost / b.weight_grams);
  return bRatio - aRatio;
}

function fillFromPicks(
  picks: ShoppingItem[],
  fullPool: ShoppingItem[],
  targetCost: number,
  targetProtein: number,
  seed: number,
): PickedItem[] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const ordered = shuffle(picks, seed * 7919 + attempt + 1);
    const result = fillInOrder(ordered, targetCost, targetProtein, true);
    if (result) return result;
  }
  const sortedPicks = [...picks].sort(byProteinPerRupeeDesc);
  const r1 = fillInOrder(sortedPicks, targetCost, targetProtein, true);
  if (r1) return r1;
  const r2 = fillInOrder(sortedPicks, targetCost, targetProtein, false);
  if (r2) return r2;
  const sortedAll = [...fullPool].sort(byProteinPerRupeeDesc);
  return fillInOrder(sortedAll, targetCost, targetProtein, false) ?? [];
}

interface DayPlan {
  day: number;
  picks: ShoppingItem[];
  plan: PickedItem[];
}

function planWeek(
  pool: ShoppingItem[],
  selectedDays: number[],
  targetCost: number,
  targetProtein: number,
  seed: number,
): DayPlan[] {
  const usable = pool.filter(
    (it) => it.protein > 0 && it.weight_grams > 0 && it.cost > 0,
  );
  if (usable.length === 0 || selectedDays.length === 0) return [];

  const count = Math.min(PICK_COUNT, usable.length);
  const shuffled = shuffle(usable, seed);
  const base = shuffled.slice(0, count);
  const reserve = shuffled.slice(count);

  const sortedDays = [...selectedDays].sort((a, b) => a - b);

  return sortedDays.map((day, index) => {
    let picks = base;
    if (index > 0 && reserve.length > 0) {
      const swapIdx = (index - 1) % count;
      const reserveIdx = (index - 1) % reserve.length;
      picks = [...base];
      picks[swapIdx] = reserve[reserveIdx];
    }
    return {
      day,
      picks,
      plan: fillFromPicks(picks, usable, targetCost, targetProtein, seed * 31 + day),
    };
  });
}

function loadSelectedDays(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAYS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((n) => typeof n === "number" && n >= 0 && n <= 6);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function MealPlanner() {
  const { items } = useShoppingList();
  const rupee = useMaskedRupee();

  const [costTarget, setCostTarget] = useState(DEFAULT_COST);
  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN);
  const [seed, setSeed] = useState(0);
  const [selectedDays, setSelectedDays] = useState<number[]>(loadSelectedDays);

  useEffect(() => {
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(selectedDays));
  }, [selectedDays]);

  const pool = useMemo(() => items.filter((i) => i.checked), [items]);
  const hasEnough = pool.length >= MIN_PICKS;

  const feasible = useMemo(() => {
    if (!hasEnough) return false;
    return maxAchievableProtein(pool, costTarget) >= proteinTarget;
  }, [pool, costTarget, proteinTarget, hasEnough]);

  const week = useMemo(
    () =>
      hasEnough && feasible
        ? planWeek(pool, selectedDays, costTarget, proteinTarget, seed)
        : [],
    [pool, selectedDays, costTarget, proteinTarget, seed, hasEnough, feasible],
  );

  const reroll = useCallback(() => setSeed((s) => s + 1), []);

  const todayIndex = new Date().getDay();

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <section className="px-6 pt-7 pb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Weekly Meal Plan
        </span>
        <button
          onClick={reroll}
          aria-label="Re-roll week"
          className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center mb-5">
        {DAY_LABELS.map((letter, i) => {
          const active = selectedDays.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              aria-label={DAY_NAMES[i]}
              aria-pressed={active}
              className={`flex-1 h-9 flex items-center justify-center text-[10px] uppercase tracking-[0.16em] transition-colors border ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground"
              } ${i === 0 ? "rounded-l-md" : ""} ${
                i === DAY_LABELS.length - 1 ? "rounded-r-md" : ""
              } ${i > 0 ? "-ml-px" : ""}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 divide-x divide-outline-variant/60 border-y border-outline-variant/60 mb-5">
        <div className="pr-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Cost target / day
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-muted-foreground text-[12px]">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={costTarget}
              onChange={(e) => setCostTarget(parseInt(e.target.value) || 0)}
              className="font-mono tabular-nums text-[18px] text-foreground bg-transparent outline-none w-full"
            />
          </div>
        </div>
        <div className="pl-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Protein target / day
          </p>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              inputMode="numeric"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(parseInt(e.target.value) || 0)}
              className="font-mono tabular-nums text-[18px] text-foreground bg-transparent outline-none w-full"
            />
            <span className="text-muted-foreground text-[12px]">g</span>
          </div>
        </div>
      </div>

      {!hasEnough ? (
        <p className="text-[12px] text-muted-foreground/80 py-4 text-center">
          Select at least {MIN_PICKS} items in your shopping list to plan a meal.
        </p>
      ) : !feasible ? (
        <p className="text-[12px] text-muted-foreground/80 py-4 text-center">
          Can't reach {proteinTarget}g protein under {rupee(costTarget, { maximumFractionDigits: 0 })} per day. Raise the cost, lower the protein, or add more food.
        </p>
      ) : selectedDays.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/80 py-4 text-center">
          Pick the days you'll eat at home.
        </p>
      ) : (
        <div>
          {week.map(({ day, plan }) => {
            const totals = plan.reduce(
              (acc, p) => ({
                calories: acc.calories + p.calories,
                protein: acc.protein + p.protein,
                cost: acc.cost + p.cost,
              }),
              { calories: 0, protein: 0, cost: 0 },
            );
            const isToday = day === todayIndex;
            return (
              <div
                key={day}
                className={`py-4 border-b border-outline-variant/60 last:border-b-0 ${
                  !isToday ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-[12px] text-foreground">
                    {DAY_NAMES[day]}
                    {isToday && (
                      <span className="ml-2 text-[9px] uppercase tracking-[0.2em] text-primary">
                        Today
                      </span>
                    )}
                  </p>
                  <span className="font-mono tabular-nums text-[11px] text-muted-foreground/70">
                    {totals.calories} kcal · {totals.protein}g · {rupee(totals.cost, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {plan.length > 0 && (
                  <div className="space-y-1.5">
                    {plan.map(({ item, grams, protein, cost }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-[12px] text-foreground truncate flex-1">
                          {item.name}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-muted-foreground shrink-0">
                          {grams}g · {protein}g · {rupee(cost, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
