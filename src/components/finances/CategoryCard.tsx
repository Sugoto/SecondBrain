import type { Transaction } from "@/lib/supabase";
import { ChevronRight, Receipt, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatDate,
  formatCurrency,
  getCategoryStyle,
} from "./constants";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon | null;
  total: number;
  count: number;
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
  onTransactionClick: (txn: Transaction) => void;
  index?: number;
}

export function CategoryCard({
  name,
  icon,
  total,
  count,
  transactions,
  isExpanded,
  onToggle,
  onTransactionClick,
  index = 0,
}: CategoryCardProps) {
  const IconComp = icon || Receipt;
  const isUncategorized = name === "Uncategorized";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className={`w-full flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/50 ${
          isUncategorized ? "" : getCategoryStyle(name)
        }`}
      >
        <motion.div
          animate={{ scale: isExpanded ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className={`h-10 w-10 rounded-xl flex items-center justify-center relative overflow-hidden ${
            isUncategorized ? "bg-muted" : getCategoryStyle(name)
          }`}
          style={{
            boxShadow: isUncategorized ? "none" : "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <IconComp
            className={`h-5 w-5 relative z-10 ${isUncategorized ? "text-muted-foreground" : ""}`}
          />
        </motion.div>
        <div className="flex-1 text-left">
          <p className="font-medium text-sm text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {count} transaction{count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatCurrency(total)}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {transactions.map((txn, i) => (
                <motion.button
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  whileTap={{ backgroundColor: "var(--accent)" }}
                  onClick={() => onTransactionClick(txn)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">
                      {txn.merchant || "Unknown"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(txn.date)}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-expense">
                    -{formatCurrency(txn.amount)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

