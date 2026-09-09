import { useMemo } from "react";
import { useUserStats } from "@/hooks/useExpenseData";
import { calculateTDEE, formatNumber } from "@/components/fitness/utils";

const WATER_LITRES = 3;
const FIBRE_GRAMS = 30;

/**
 * Home-page presentation of the day's calorie target. Shares the TDEE math with
 * the fitness tracker but not the layout, so the fitness page is unaffected.
 */
export function NutritionSummary() {
  const { userStats } = useUserStats();

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE({
      height_cm: userStats.height_cm,
      weight_kg: userStats.weight_kg,
      age: userStats.age,
      gender: userStats.gender,
      activity_level: userStats.activity_level,
      calorie_adjustment: userStats.calorie_adjustment,
    });
  }, [userStats]);

  const hasHealthData =
    userStats?.height_cm && userStats?.weight_kg && userStats?.age && userStats?.gender;

  if (!hasHealthData || !tdee) return null;

  const macros = [
    { value: tdee.protein, unit: "g", label: "Protein" },
    { value: tdee.carbs, unit: "g", label: "Carbs" },
    { value: tdee.fat, unit: "g", label: "Fat" },
    { value: FIBRE_GRAMS, unit: "g", label: "Fibre" },
    { value: WATER_LITRES, unit: "L", label: "Water" },
  ];

  return (
    <section className="ui-panel px-5 pt-5 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Eat today</h2>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="ui-num text-[34px] font-medium leading-none tracking-[-0.02em] text-foreground">
              {formatNumber(tdee.targetCalories)}
            </span>
            <span className="text-[13px] text-[var(--ui-ink-softer)]">kcal</span>
          </div>
        </div>

        <dl className="shrink-0 text-right">
          <dt className="text-[11px] text-[var(--ui-ink-softer)]">Burn</dt>
          <dd className="ui-num mt-1 text-[13px] text-[var(--ui-ink-soft)]">
            {formatNumber(tdee.tdee)}
          </dd>
        </dl>
      </div>

      <ul className="ui-inset mt-4 flex items-center justify-between px-4 py-3">
        {macros.map(({ value, unit, label }) => (
          <li key={label} className="text-center">
            <p className="ui-num text-[15px] font-medium leading-none text-foreground">
              {value}
              <span className="text-[11px] font-normal text-[var(--ui-ink-softer)]">{unit}</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-none text-[var(--ui-ink-softer)]">{label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
