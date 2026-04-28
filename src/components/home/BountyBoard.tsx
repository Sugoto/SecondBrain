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
    <div className="bg-card border border-outline-variant rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-label-m text-foreground">Daily Goals</span>
        </div>
        <span className={cn(
          "text-label-s font-mono px-2 py-0.5 rounded-full transition-colors",
          allDone
            ? "bg-tertiary-container"
            : "bg-surface-container text-muted-foreground"
        )}>
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="h-1 rounded-full bg-surface-container mb-2.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {DAILY_GOALS.map((goal) => {
          const isCompleted = completedGoals.has(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl transition-colors",
                isCompleted
                  ? "bg-surface-container"
                  : ""
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted
                    ? "bg-primary"
                    : "border-2 border-outline"
                )}
              >
                {isCompleted && (
                  <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                )}
              </div>

              <span
                className={cn(
                  "text-body-m transition-colors",
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
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
