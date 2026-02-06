import { useCallback, memo, useRef } from "react";
import type { Transaction } from "@/lib/supabase";
import { motion } from "framer-motion";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { useVirtualizer } from "@tanstack/react-virtual";

// Compact row height for neo-brutalism cards (card height + gap for shadow + spacing)
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
      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8 text-center rounded-xl border-2 border-dashed border-black/30 dark:border-white/30 bg-card">
            <p className="text-muted-foreground font-medium">
              No transactions for this period
            </p>
          </div>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-1 md:px-2 pt-4 space-y-4">
      <div
        ref={parentRef}
        className="h-[72dvh] overflow-auto scrollbar-hide px-4 md:px-4"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            paddingRight: "4px", // Extra space for shadow on right
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
                  right: 0,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: "8px", // Space between cards for shadow
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

      <div className="px-4 md:px-4">
        <Footer />
      </div>
    </div>
  );
});
