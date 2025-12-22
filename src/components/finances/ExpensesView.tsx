import { useMemo, useCallback, memo, useState } from "react";
import type { Transaction } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { formatCurrency } from "./constants";
import { ChevronDown } from "lucide-react";

// Batch size for progressive loading - reduces initial render cost
const INITIAL_BATCH_SIZE = 20;
const LOAD_MORE_SIZE = 20;

interface ExpensesViewProps {
  transactions: Transaction[];
  onTransactionClick: (txn: Transaction) => void;
}

export const ExpensesView = memo(function ExpensesView({
  transactions,
  onTransactionClick,
}: ExpensesViewProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  // Memoize click handler factory to avoid recreating functions
  const handleTransactionClick = useCallback((txn: Transaction) => {
    onTransactionClick(txn);
  }, [onTransactionClick]);
  
  // Progressive loading - only render visible transactions
  const visibleTransactions = useMemo(() => 
    transactions.slice(0, visibleCount), 
    [transactions, visibleCount]
  );
  
  const hasMore = transactions.length > visibleCount;
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + LOAD_MORE_SIZE);
  }, []);

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
      {/* Transaction Grid - Progressive Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {visibleTransactions.map((txn, index) => (
          <TransactionCard
            key={txn.id}
            transaction={txn}
            onClick={handleTransactionClick}
            index={index}
          />
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Show More ({transactions.length - visibleCount} remaining)
          </Button>
        </motion.div>
      )}

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

