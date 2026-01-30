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

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="px-3 py-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Daily Goals
        </span>
      </div>

      {/* Goals list */}
      <div className="divide-y divide-border">
        {DAILY_GOALS.map((goal) => {
          const isCompleted = completedGoals.has(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                "hover:bg-accent/50 active:bg-accent"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded flex items-center justify-center transition-colors shrink-0",
                  isCompleted
                    ? "bg-foreground text-background"
                    : "border border-muted-foreground/30"
                )}
              >
                {isCompleted && <Check className="h-2.5 w-2.5" />}
              </div>
              <span
                className={cn(
                  "text-xs transition-colors",
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

// Keep the old export name for backwards compatibility
export { DailyGoals as BountyBoard };
