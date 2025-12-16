import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Dumbbell, Brain, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData } from "@/hooks/useExpenseData";
import { formatCurrency } from "@/components/expense-tracker/constants";
import {
  getCategoryTotals,
  generateSpendingSummary,
} from "@/components/expense-tracker/utils";
import type { AppSection } from "@/types/navigation";

interface HomePageProps {
  onNavigate: (section: AppSection) => void;
}

function SummaryText({ text }: { text: string }) {
  const parts = text.split(/(₹[\d,.]+k?)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("₹") ? (
          <span key={i} className="font-mono font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SpendingSummaryCard() {
  const { transactions, loading } = useExpenseData();
  const { theme } = useTheme();

  const spendingSummary = useMemo(() => {
    if (loading || transactions.length === 0) {
      return "";
    }

    const categoryTotals = getCategoryTotals(transactions, "month", {
      excludeBudgetExcluded: true,
    });

    return generateSpendingSummary(categoryTotals, "month", formatCurrency);
  }, [transactions, loading]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div
          className="p-3.5 rounded-xl"
          style={{
            background:
              theme === "dark"
                ? "rgba(139, 92, 246, 0.1)"
                : "rgba(139, 92, 246, 0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full bg-muted/50 rounded" />
              <div className="h-3 w-2/3 bg-muted/50 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!spendingSummary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className="p-3.5 rounded-xl overflow-hidden relative"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)"
              : "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(139, 92, 246, 0.08) 100%)",
          boxShadow:
            theme === "dark"
              ? "0 4px 20px -2px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              : "0 4px 16px -2px rgba(139, 92, 246, 0.15)",
          border:
            theme === "dark"
              ? "1px solid rgba(139, 92, 246, 0.3)"
              : "1px solid rgba(139, 92, 246, 0.2)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Glassmorphic shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
          }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.3) 100%)"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)",
              boxShadow:
                theme === "dark"
                  ? "0 2px 12px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  : "0 2px 8px rgba(139, 92, 246, 0.25)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              }}
            />
            <Sparkles className="h-4 w-4 text-primary relative z-10" />
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            <SummaryText text={spendingSummary} />
          </p>
        </div>
      </div>
    </motion.div>
  );
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
            <h1 className="text-2xl font-bold">Sugoto's Second Brain</h1>
            <p className="text-sm text-muted-foreground">A personal hub</p>
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

          {/* Spending Summary Card - below the cards */}
          <SpendingSummaryCard />
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

