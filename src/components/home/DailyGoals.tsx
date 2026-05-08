import { useState, useEffect } from "react";
import { Check, Flag } from "lucide-react";
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
    const stored = localStorage.getItem("daily-goals");
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
      "daily-goals",
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

  return (
    <div className="bg-card border border-outline-variant rounded-2xl px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Flag className="h-3.5 w-3.5 text-foreground" />
        <span className="text-label-m text-foreground">Daily Goals</span>
      </div>

      <div className="flex flex-col gap-1">
        {DAILY_GOALS.map((goal) => {
          const isCompleted = completedGoals.has(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "w-full flex items-center gap-1.5 px-1.5 py-1 text-left rounded-md transition-colors",
                isCompleted
                  ? "bg-surface-container"
                  : ""
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted
                    ? "bg-primary"
                    : "border-[1.5px] border-outline"
                )}
              >
                {isCompleted && (
                  <Check className="h-1.5 w-1.5 text-primary-foreground" strokeWidth={3} />
                )}
              </div>

              <span
                className={cn(
                  "text-label-m transition-colors",
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
