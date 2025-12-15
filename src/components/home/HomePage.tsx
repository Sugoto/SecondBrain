import { motion } from "framer-motion";
import { Wallet, Dumbbell, Brain } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { AppSection } from "@/types/navigation";

interface HomePageProps {
  onNavigate: (section: AppSection) => void;
}

const APP_CARDS = [
  {
    id: "expenses" as const,
    title: "Expense Tracker",
    description: "Track spending, manage budgets, analyze trends",
    icon: Wallet,
    gradient: "from-violet-500 to-purple-600",
    shadowColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    id: "fitness" as const,
    title: "Fitness & Nutrition",
    description: "Workouts, meals, and health tracking",
    icon: Dumbbell,
    gradient: "from-emerald-500 to-teal-600",
    shadowColor: "rgba(16, 185, 129, 0.4)",
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Second Brain</h1>
            <p className="text-sm text-muted-foreground">Your personal hub</p>
          </div>
        </motion.div>
      </header>

      {/* App Cards */}
      <main className="px-6 space-y-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          What would you like to manage today?
        </motion.p>

        <div className="space-y-4">
          {APP_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(card.id)}
                className="w-full text-left"
              >
                <div
                  className="relative p-5 rounded-2xl overflow-hidden"
                  style={{
                    background: isDark
                      ? "rgba(30, 30, 35, 0.8)"
                      : "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: isDark
                      ? "1px solid rgba(63, 63, 70, 0.5)"
                      : "1px solid rgba(228, 228, 231, 0.8)",
                    boxShadow: `0 8px 32px ${card.shadowColor}`,
                  }}
                >
                  {/* Gradient accent */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient}`}
                  />

                  {/* Glass shine */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
                    }}
                  />

                  <div className="relative flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.gradient}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">{card.title}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          <span
            className="font-medium"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
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

