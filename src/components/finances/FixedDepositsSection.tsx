import { useState, useMemo } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserStats } from "@/lib/supabase";
import { calculateFDValues } from "./fdUtils";

interface FixedDepositsSectionProps {
  userStats: UserStats | null;
}

export function FixedDepositsSection({
  userStats,
}: FixedDepositsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const principal = userStats?.fixed_deposits ?? 0;

  // Calculate current and maturity values for all FDs using shared utility
  const fdCalculations = useMemo(
    () => calculateFDValues(principal),
    [principal]
  );

  if (principal === 0 || fdCalculations.length === 0) return null;

  // Total current value across all FDs
  const totalCurrentValue = fdCalculations.reduce(
    (sum, fd) => sum + fd.currentValue,
    0
  );
  const totalInterestEarned = fdCalculations.reduce(
    (sum, fd) => sum + fd.interestEarned,
    0
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Fixed Deposits
      </h3>
      <div className="overflow-hidden rounded-xl border-2 border-black dark:border-white bg-card shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]">
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-pastel-yellow/30"
        >
          <span className="text-base font-bold font-mono text-foreground">
            ₹{Math.round(totalCurrentValue).toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-medium text-muted-foreground">
              +₹{Math.round(totalInterestEarned).toLocaleString("en-IN")}
            </span>
            <div className="h-7 w-7 rounded-md bg-white dark:bg-white/10 border-2 border-black dark:border-white flex items-center justify-center">
              <ChevronDown
                className={`h-4 w-4 text-black dark:text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {/* Divider */}
                <div className="h-0.5 bg-black/10 dark:bg-white/10 mb-4" />

                {/* FD Details */}
                <div className="space-y-3">
                  {fdCalculations.map((fd, index) => (
                    <div
                      key={index}
                      className="py-3 px-3 rounded-lg bg-pastel-green/50 border-2 border-black/20 dark:border-white/20"
                    >
                      {/* Bank & Rate */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-foreground">{fd.bank}</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {fd.rate}% p.a. • Matures {fd.maturityDateFormatted}
                        </span>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-md bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Principal
                          </p>
                          <p className="text-sm font-mono font-bold text-foreground">
                            ₹{fd.principal.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="p-2 rounded-md bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Current
                          </p>
                          <p className="text-sm font-mono font-bold text-foreground">
                            ₹
                            {Math.round(fd.currentValue).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div className="p-2 rounded-md bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            At Maturity
                          </p>
                          <p className="text-sm font-mono font-bold text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />₹
                            {Math.round(fd.maturityValue).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
