import { useCallback, memo, useRef } from "react";
import type { Transaction } from "@/lib/supabase";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { useVirtualizer } from "@tanstack/react-virtual";

const ROW_HEIGHT = 60;
const OVERSCAN = 6;

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
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="py-16 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            No transactions
          </p>
          <p className="text-[13px] text-muted-foreground/70">
            Nothing recorded for this period yet.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div
        ref={parentRef}
        className="h-[72dvh] overflow-auto scrollbar-hide px-6"
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
                  right: 0,
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

      <div className="px-6 pt-4">
        <Footer />
      </div>
    </div>
  );
});
