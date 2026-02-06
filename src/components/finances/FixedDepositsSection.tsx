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
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Fixed Deposits
      </h3>
      <div className="overflow-hidden rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left transition-colors hover:bg-pastel-yellow/30"
        >
          <span className="text-sm font-bold font-mono text-foreground">
            ₹{Math.round(totalCurrentValue).toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-muted-foreground">
              +₹{Math.round(totalInterestEarned).toLocaleString("en-IN")}
            </span>
            <div className="h-5 w-5 rounded flex items-center justify-center border-[1.5px] border-black dark:border-white bg-white dark:bg-white/10">
              <ChevronDown
                className={`h-3 w-3 text-black dark:text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
              <div className="px-3 pb-3">
                {/* Divider */}
                <div className="h-px bg-black/10 dark:bg-white/10 mb-2" />

                {/* FD Details */}
                <div className="space-y-2">
                  {fdCalculations.map((fd, index) => (
                    <div
                      key={index}
                      className="py-2 px-2 rounded-md bg-pastel-green/50 border border-black/20 dark:border-white/20"
                    >
                      {/* Bank & Rate */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">{fd.bank}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {fd.rate}% p.a. • Matures {fd.maturityDateFormatted}
                        </span>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            Principal
                          </p>
                          <p className="text-xs font-mono font-bold text-foreground">
                            ₹{fd.principal.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="p-1.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            Current
                          </p>
                          <p className="text-xs font-mono font-bold text-foreground">
                            ₹
                            {Math.round(fd.currentValue).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div className="p-1.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            At Maturity
                          </p>
                          <p className="text-xs font-mono font-bold text-muted-foreground flex items-center justify-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />₹
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
