import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useExpenseData } from "@/hooks/useExpenseData";
import { formatCurrency } from "@/components/finances/constants";
import {
  getCategoryTotals,
  generateSpendingSummary,
} from "@/components/finances/utils";
import { PageHeader } from "@/components/shared/PageHeader";

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
      transition={{ duration: 0.3, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
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

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-8 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageHeader
            title="Second Brain"
            icon={Brain}
            iconGradient="linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)"
            iconShadow="0 4px 12px rgba(139, 92, 246, 0.3)"
          />
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-4">
        <SpendingSummaryCard />
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
