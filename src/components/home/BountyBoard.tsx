import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Goal type definition
interface Goal {
  id: string;
  label: string;
}

// Daily goals configuration
const DAILY_GOALS: Goal[] = [
  { id: "walk", label: "Walk 5k steps" },
  { id: "gym", label: "Workout at the Gym" },
  { id: "no-snacks", label: "No Snacks" },
];

// Get today's date key for localStorage
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Daily Goals Component
export function DailyGoals() {
  // Load completed goals from localStorage, reset daily
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem("bounty-board");
    if (!stored) return new Set();
    try {
      const { date, completed } = JSON.parse(stored);
      if (date === getTodayKey()) {
        return new Set(completed);
      }
    } catch {
      // Invalid data, reset
    }
    return new Set();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(
      "bounty-board",
      JSON.stringify({
        date: getTodayKey(),
        completed: Array.from(completedGoals),
      })
    );
  }, [completedGoals]);

  const toggleGoal = (goalId: string) => {
    setCompletedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  // Pastel colors for each goal
  const goalColors = ["bg-pastel-pink", "bg-pastel-purple", "bg-pastel-orange"];

  return (
    <div className="rounded-lg bg-pastel-yellow p-3 neo-brutal-sm">
      {/* Header */}
      <div className="mb-2">
        <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wide">
          Daily Goals
        </span>
      </div>

      {/* Goals list */}
      <div className="flex flex-col gap-1.5">
        {DAILY_GOALS.map((goal, index) => {
          const isCompleted = completedGoals.has(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-md border-[1.5px] border-black dark:border-white transition-all",
                isCompleted ? "bg-white dark:bg-white/10" : goalColors[index % goalColors.length],
                !isCompleted && "shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px]",
                isCompleted && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded flex items-center justify-center transition-colors shrink-0 border-[1.5px] border-black dark:border-white",
                  isCompleted
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-white/10"
                )}
              >
                {isCompleted && <Check className="h-2.5 w-2.5" />}
              </div>
              <span
                className={cn(
                  "text-xs font-bold transition-colors",
                  isCompleted
                    ? "text-black/50 dark:text-white/50 line-through"
                    : "text-black dark:text-white"
                )}
              >
                {goal.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Keep the old export name for backwards compatibility
export { DailyGoals as BountyBoard };
