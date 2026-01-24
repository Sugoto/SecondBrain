import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sun,
  Moon,
  Scroll,
  Footprints,
  Dumbbell,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

function CharacterHeader() {
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4"
    >
      <div
        className="relative rounded-xl p-3 overflow-hidden"
        style={{
          background: isDark
            ? "rgba(20, 20, 22, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
          border: isDark
            ? "1px solid rgba(139, 92, 246, 0.2)"
            : "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.4)"
            : "0 4px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Character Name */}
          <h1 className="text-lg font-semibold font-fantasy tracking-wide">
            Sugoto Basu
          </h1>
          
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: isDark
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(139, 92, 246, 0.08)",
              border: isDark
                ? "1px solid rgba(139, 92, 246, 0.3)"
                : "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-violet-400" />
            ) : (
              <Moon className="h-4 w-4 text-violet-600" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Daily quests configuration
const DAILY_QUESTS = [
  { id: "walk", label: "Walk 5k steps", icon: Footprints },
  { id: "gym", label: "Workout at the Gym", icon: Dumbbell },
];

// Get today's date key for localStorage
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Bounty Board - Daily repeatable quests
function BountyBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Load completed quests from localStorage, reset daily
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(() => {
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
        completed: Array.from(completedQuests),
      })
    );
  }, [completedQuests]);

  const toggleQuest = (questId: string) => {
    setCompletedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-4"
    >
      <div
        className="rounded-lg p-3 overflow-hidden"
        style={{
          background: isDark
            ? "rgba(20, 20, 22, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
          border: isDark
            ? "1px solid rgba(139, 92, 246, 0.15)"
            : "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: isDark
            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="h-6 w-6 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.4)",
            }}
          >
            <Scroll className="h-3 w-3 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-fantasy">
            Bounty Board
          </span>
        </div>

        {/* Quest list */}
        <div className="space-y-2">
          {DAILY_QUESTS.map((quest) => {
            const isCompleted = completedQuests.has(quest.id);
            const Icon = quest.icon;
            
            return (
              <button
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg transition-all active:scale-[0.98]"
                style={{
                  background: isCompleted
                    ? isDark
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(34, 197, 94, 0.1)"
                    : isDark
                      ? "rgba(139, 92, 246, 0.08)"
                      : "rgba(139, 92, 246, 0.05)",
                  border: isCompleted
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : isDark
                      ? "1px solid rgba(139, 92, 246, 0.1)"
                      : "1px solid rgba(0, 0, 0, 0.04)",
                }}
              >
                {/* Checkbox */}
                <div
                  className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    border: isCompleted
                      ? "none"
                      : isDark
                        ? "1px solid rgba(255, 255, 255, 0.2)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                
                {/* Quest icon */}
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{
                    color: isCompleted
                      ? "#22c55e"
                      : isDark
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.4)",
                  }}
                />
                
                {/* Quest label */}
                <span className="flex-1 text-left text-sm font-medium">
                  {quest.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {/* Character Profile Header */}
        <CharacterHeader />

        {/* Bounty Board - Daily Quests */}
        <BountyBoard />

      </main>

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center">
        <p className="text-[10px] text-muted-foreground font-fantasy tracking-wide">
          Forged in {new Date().getFullYear()} by{" "}
          <span
            className="font-semibold"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sugoto Basu
          </span>
        </p>
      </footer>
    </div>
  );
}
