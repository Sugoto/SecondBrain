import { useMemo } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { formatCurrency } from "./constants";

interface ExpensesViewProps {
  transactions: Transaction[];
  onTransactionClick: (txn: Transaction) => void;
}

export function ExpensesView({
  transactions,
  onTransactionClick,
}: ExpensesViewProps) {
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No transactions for this period
            </p>
          </Card>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
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

      {/* Total Expenses Card */}
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
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%, rgba(239, 68, 68, 0.03) 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)",
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

