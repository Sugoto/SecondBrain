import { useState, useEffect } from "react";
import { Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  label: string;
}

const DAILY_GOALS: Goal[] = [
  { id: "walk", label: "Walk 5k steps" },
  { id: "gym", label: "Workout at the Gym" },
  { id: "no-snacks", label: "No Snacks" },
];

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DailyGoals() {
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

  const completedCount = completedGoals.size;
  const totalCount = DAILY_GOALS.length;
  const allDone = completedCount === totalCount;

  return (
    <div className="vercel-card vercel-glow p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center">
            <Target className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Daily Goals
          </span>
        </div>
        <span className={cn(
          "vercel-badge font-mono transition-colors",
          allDone && "!border-emerald-200/50 dark:!border-emerald-500/20 !bg-emerald-50/80 dark:!bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400"
        )}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Gradient progress bar */}
      <div className="h-1 rounded-full bg-neutral-100 dark:bg-white/5 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full vercel-progress transition-all duration-700 ease-out"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Goal items */}
      <div className="flex flex-col gap-2">
        {DAILY_GOALS.map((goal) => {
          const isCompleted = completedGoals.has(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-3 text-left rounded-xl transition-all duration-200",
                isCompleted
                  ? "bg-neutral-50/50 dark:bg-white/[0.02]"
                  : "bg-neutral-50/80 dark:bg-white/[0.03] hover:bg-neutral-100/80 dark:hover:bg-white/[0.06]"
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                  isCompleted
                    ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_12px_-2px_rgba(139,92,246,0.5)]"
                    : "border border-neutral-300/80 dark:border-white/15"
                )}
              >
                {isCompleted && (
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[13px] font-medium transition-all duration-200",
                  isCompleted
                    ? "text-neutral-300 dark:text-neutral-600 line-through"
                    : "text-neutral-700 dark:text-neutral-300"
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
