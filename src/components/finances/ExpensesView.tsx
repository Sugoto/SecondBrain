import { useMemo, useCallback, memo, useRef } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { formatCurrency } from "./constants";
import { useVirtualizer } from "@tanstack/react-virtual";

const ROW_HEIGHT = 56;
const OVERSCAN = 5;

interface ExpensesViewProps {
  transactions: Transaction[];
  onTransactionClick: (txn: Transaction) => void;
}

export const ExpensesView = memo(function ExpensesView({
  transactions,
  onTransactionClick,
}: ExpensesViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleTransactionClick = useCallback(
    (txn: Transaction) => {
      onTransactionClick(txn);
    },
    [onTransactionClick]
  );

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

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
      <div
        ref={parentRef}
        className="h-[60vh] overflow-auto scrollbar-hide"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const txn = transactions[virtualRow.index];
            return (
              <div
                key={txn.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TransactionCard
                  transaction={txn}
                  onClick={handleTransactionClick}
                  index={virtualRow.index}
                />
              </div>
            );
          })}
        </div>
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
});
