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

  const fdCalculations = useMemo(
    () => calculateFDValues(principal),
    [principal]
  );

  if (principal === 0 || fdCalculations.length === 0) return null;

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
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Summary Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left transition-colors hover:bg-muted"
        >
          <span className="text-sm font-bold font-mono text-foreground">
            ₹{Math.round(totalCurrentValue).toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-muted-foreground">
              +₹{Math.round(totalInterestEarned).toLocaleString("en-IN")}
            </span>
            <div className="h-5 w-5 rounded-lg flex items-center justify-center border border-border bg-muted">
              <ChevronDown
                className={`h-3 w-3 text-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
                <div className="h-px bg-border mb-2" />

                <div className="space-y-2">
                  {fdCalculations.map((fd, index) => (
                    <div
                      key={index}
                      className="py-2 px-2 rounded-lg bg-muted/50 border border-border"
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
                        <div className="p-1.5 rounded-lg bg-card border border-border">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            Principal
                          </p>
                          <p className="text-xs font-mono font-bold text-foreground">
                            ₹{fd.principal.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-card border border-border">
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
                        <div className="p-1.5 rounded-lg bg-card border border-border">
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
