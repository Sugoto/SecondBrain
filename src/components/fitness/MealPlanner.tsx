import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Beef, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
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

function maxAchievableProtein(
  pool: ShoppingItem[],
  targetCost: number
): number {
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
  applyContribCap: boolean
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
      gramsForContribCap
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
  seed: number
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
  seed: number
): DayPlan[] {
  const usable = pool.filter(
    (it) => it.protein > 0 && it.weight_grams > 0 && it.cost > 0
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
      return parsed.filter(
        (n) => typeof n === "number" && n >= 0 && n <= 6
      );
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
    [pool, selectedDays, costTarget, proteinTarget, seed, hasEnough, feasible]
  );

  const reroll = useCallback(() => setSeed((s) => s + 1), []);

  const todayIndex = new Date().getDay();

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-title-s text-foreground">Weekly Meal Planner</h3>
        <button
          onClick={reroll}
          aria-label="Re-roll week"
          className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container text-foreground active:scale-95 transition-transform"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {DAY_LABELS.map((letter, i) => {
          const active = selectedDays.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              aria-label={DAY_NAMES[i]}
              aria-pressed={active}
              className={`flex-1 h-8 rounded-full flex items-center justify-center text-label-m transition-colors active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-muted-foreground"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-outline-variant bg-card px-4 py-3 grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-label-m text-muted-foreground flex items-center gap-1">
            <IndianRupee className="h-3 w-3" /> Cost target
          </label>
          <Input
            type="number"
            inputMode="numeric"
            value={costTarget}
            onChange={(e) => setCostTarget(parseInt(e.target.value) || 0)}
            className="font-mono h-9 text-body-m bg-surface-container border-0 rounded-lg px-3"
          />
        </div>
        <div className="space-y-1">
          <label className="text-label-m text-muted-foreground flex items-center gap-1">
            <Beef className="h-3 w-3" /> Protein target
          </label>
          <Input
            type="number"
            inputMode="numeric"
            value={proteinTarget}
            onChange={(e) => setProteinTarget(parseInt(e.target.value) || 0)}
            className="font-mono h-9 text-body-m bg-surface-container border-0 rounded-lg px-3"
          />
        </div>
      </div>

      {!hasEnough ? (
        <p className="text-label-s text-muted-foreground py-3 text-center">
          Select at least {MIN_PICKS} items in your shopping list to plan a meal.
        </p>
      ) : !feasible ? (
        <p className="text-label-s text-muted-foreground py-3 text-center">
          Can't reach {proteinTarget}g protein under {rupee(costTarget, { maximumFractionDigits: 0 })} with one daily serving each. Raise the cost, lower the protein, or add more food.
        </p>
      ) : selectedDays.length === 0 ? (
        <p className="text-label-s text-muted-foreground py-3 text-center">
          Pick the days you'll eat at home.
        </p>
      ) : (
        <div className="space-y-2">
          {week.map(({ day, plan }) => {
            const totals = plan.reduce(
              (acc, p) => ({
                calories: acc.calories + p.calories,
                protein: acc.protein + p.protein,
                cost: acc.cost + p.cost,
              }),
              { calories: 0, protein: 0, cost: 0 }
            );
            const isToday = day === todayIndex;
            return (
              <div
                key={day}
                className={`rounded-2xl px-4 py-3 space-y-1.5 transition-colors ${
                  isToday
                    ? "bg-primary-container"
                    : "border border-outline-variant bg-card opacity-70"
                }`}
              >
                <p className="text-label-l text-foreground">
                  {DAY_NAMES[day]}
                  {isToday && (
                    <span className="ml-2 text-label-s text-muted-foreground">Today</span>
                  )}
                </p>
                {plan.length > 0 && (
                  <>
                    {plan.map(({ item, grams, protein, cost }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 px-1"
                      >
                        <span className="text-body-s text-foreground truncate flex-1">
                          {item.name}
                        </span>
                        <span className="font-mono text-label-s text-muted-foreground shrink-0">
                          {grams}g · {protein}g · {rupee(cost, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-outline-variant">
                      <div className="flex items-center justify-between gap-2 px-1">
                        <span className="text-body-s text-foreground flex-1">Total</span>
                        <span className="font-mono text-label-s text-muted-foreground shrink-0">
                          {totals.calories} kcal · {totals.protein}g · {rupee(totals.cost, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
