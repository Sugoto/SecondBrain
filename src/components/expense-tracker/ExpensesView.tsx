import { useMemo } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { formatCurrency } from "./constants";
import { generateSpendingSummary } from "./utils";
import type { CategoryTotal } from "./utils";
import type { TimeFilter } from "./types";

interface ExpensesViewProps {
  transactions: Transaction[];
  summaryCategoryTotals: Record<string, CategoryTotal>;
  timeFilter: TimeFilter;
  onTransactionClick: (txn: Transaction) => void;
}

// Helper to render summary with monospace amounts
function SummaryText({ text }: { text: string }) {
  // Match currency patterns like ₹1,234 or ₹1.2k
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

export function ExpensesView({
  transactions,
  summaryCategoryTotals,
  timeFilter,
  onTransactionClick,
}: ExpensesViewProps) {
  const { theme } = useTheme();
  // Total expenses for this period - full amounts (no proration, no exclusions)
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Generate natural language summary (uses budget-aware totals with proration)
  const spendingSummary = useMemo(
    () =>
      generateSpendingSummary(
        summaryCategoryTotals,
        timeFilter,
        formatCurrency
      ),
    [summaryCategoryTotals, timeFilter]
  );

  if (transactions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
        {/* Spending Summary - shown even when empty */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div 
            className="p-3.5 rounded-xl overflow-hidden relative"
            style={{
              background: theme === "dark" 
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)"
                : "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(139, 92, 246, 0.08) 100%)",
              boxShadow: theme === "dark"
                ? "0 4px 20px -2px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 4px 16px -2px rgba(139, 92, 246, 0.15)",
              border: theme === "dark" 
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
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <div 
                className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.3) 100%)"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)",
                  boxShadow: theme === "dark"
                    ? "0 2px 12px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 2px 8px rgba(139, 92, 246, 0.25)",
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No transactions for this period
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Run your Google Apps Script to sync transactions from Gmail
            </p>
          </Card>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
      {/* Spending Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div 
            className="p-3.5 rounded-xl overflow-hidden relative"
            style={{
              background: theme === "dark" 
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)"
                : "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(139, 92, 246, 0.08) 100%)",
              boxShadow: theme === "dark"
                ? "0 4px 20px -2px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 4px 16px -2px rgba(139, 92, 246, 0.15)",
              border: theme === "dark" 
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
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <div 
                className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.3) 100%)"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)",
                  boxShadow: theme === "dark"
                    ? "0 2px 12px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 2px 8px rgba(139, 92, 246, 0.25)",
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
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

      {/* Transaction Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {transactions.map((txn, index) => (
          <TransactionCard
            key={txn.id}
            transaction={txn}
            onClick={() => onTransactionClick(txn)}
            index={index}
          />
        ))}
      </div>

      {/* Total Expenses Card - full amounts (no proration, no exclusions) */}
      <div className="border-t border-border" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <Card 
          className="p-4 overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%, rgba(239, 68, 68, 0.03) 100%)",
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)",
            }}
          />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-sm font-medium">Total Expenses</h3>
              <p className="text-xs text-muted-foreground">
                No Prorations or Exclusions
              </p>
            </div>
            <span 
              className="text-lg font-bold font-mono"
              style={{
                color: "#ef4444",
                textShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
              }}
            >
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </Card>
      </motion.div>

      <Footer />
    </div>
  );
}
