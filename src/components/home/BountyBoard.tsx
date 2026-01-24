import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { RoughNotation } from "react-rough-notation";

// Quest type definition
interface Quest {
  id: string;
  label: string;
}

// Daily quests configuration
const DAILY_QUESTS: Quest[] = [
  { id: "walk", label: "Walk 5k steps" },
  { id: "gym", label: "Workout at the Gym" },
  { id: "no-snacks", label: "No Snacks today" },
];

// Get today's date key for localStorage
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Generate consistent random rotation for each quest card
function getQuestRotation(questId: string): number {
  // Simple hash to get consistent rotation per quest
  let hash = 0;
  for (let i = 0; i < questId.length; i++) {
    hash = questId.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Return rotation between -2 and 2 degrees
  return ((hash % 5) - 2) * 0.8;
}

// Bounty Board - Daily repeatable quests
export function BountyBoard() {
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

  // Memoize rotations so they don't change on re-render
  const questRotations = useMemo(() => {
    return DAILY_QUESTS.reduce(
      (acc, quest) => {
        acc[quest.id] = getQuestRotation(quest.id);
        return acc;
      },
      {} as Record<string, number>
    );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-4"
    >
      {/* Wooden Board Container */}
      <div
        className="relative rounded-xl p-4 overflow-hidden pb-8"
        style={{
          // Wood grain background
          background: isDark
            ? `linear-gradient(135deg, 
                #2d1f14 0%, 
                #3d2a1c 25%, 
                #2a1e12 50%, 
                #3a2618 75%, 
                #2d1f14 100%)`
            : `linear-gradient(135deg, 
                #8B5A2B 0%, 
                #A0522D 25%, 
                #8B4513 50%, 
                #A0522D 75%, 
                #8B5A2B 100%)`,
          border: isDark ? "3px solid #1a1208" : "3px solid #5D3A1A",
          boxShadow: isDark
            ? "inset 0 2px 10px rgba(0,0,0,0.5), 0 8px 24px rgba(0, 0, 0, 0.6)"
            : "inset 0 2px 10px rgba(0,0,0,0.2), 0 8px 24px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Wood grain texture overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-center mb-4">
          <span
            className="text-sm font-bold uppercase tracking-wider font-fantasy"
            style={{
              color: isDark ? "#d4a574" : "#fef3c7",
              textShadow: isDark
                ? "1px 1px 2px rgba(0,0,0,0.8)"
                : "1px 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            Bounty Board
          </span>
        </div>

        {/* Quest Grid - 2 columns */}
        <div className="relative grid grid-cols-2 gap-3">
          {DAILY_QUESTS.map((quest, index) => {
            const isCompleted = completedQuests.has(quest.id);
            const rotation = questRotations[quest.id];

            return (
              <motion.button
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                initial={{ opacity: 0, y: 20, rotate: rotation }}
                animate={{ opacity: 1, y: 0, rotate: rotation }}
                whileHover={{
                  scale: 1.03,
                  rotate: 0,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.97 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative flex flex-col items-center px-3 pt-5 pb-3 rounded-sm transition-shadow"
                style={{
                  // Parchment/paper background
                  background: isDark
                    ? `linear-gradient(145deg, 
                        #d4c4a8 0%, 
                        #c9b896 30%, 
                        #bfae88 70%, 
                        #b8a57d 100%)`
                    : `linear-gradient(145deg, 
                        #fdf6e3 0%, 
                        #f5e6c8 30%, 
                        #ebe0c0 70%, 
                        #e6d9b5 100%)`,
                  boxShadow: `
                    2px 3px 8px rgba(0,0,0,0.4),
                    inset 0 0 20px rgba(139, 90, 43, 0.1)
                  `,
                  border: "1px solid rgba(139, 90, 43, 0.3)",
                }}
              >
                {/* Pin/Tack at top */}
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, 
                      #e5e7eb 0%, 
                      #9ca3af 40%, 
                      #6b7280 70%, 
                      #4b5563 100%)`,
                    boxShadow: `
                      0 2px 4px rgba(0,0,0,0.5),
                      inset 0 1px 2px rgba(255,255,255,0.4)
                    `,
                    border: "1px solid #374151",
                  }}
                >
                  {/* Pin highlight */}
                  <div
                    className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.6)",
                    }}
                  />
                </div>

                {/* Quest label with strikethrough */}
                <div className="text-center">
                  <RoughNotation
                    type="strike-through"
                    show={isCompleted}
                    color="#059669"
                    strokeWidth={2}
                    iterations={1}
                    animationDuration={400}
                    multiline={true}
                  >
                    <span
                      className="text-xs font-semibold font-fantasy leading-tight block"
                      style={{
                        color: isCompleted ? "#6b7280" : "#44403c",
                        textShadow: "0 1px 0 rgba(255,255,255,0.5)",
                      }}
                    >
                      {quest.label}
                    </span>
                  </RoughNotation>
                </div>

                {/* Subtle paper texture */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-sm opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
