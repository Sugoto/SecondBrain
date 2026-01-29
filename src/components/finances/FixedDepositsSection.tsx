import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Landmark, ChevronDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserStats } from "@/lib/supabase";
import { calculateFDValues } from "./fdUtils";

interface FixedDepositsSectionProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function FixedDepositsSection({
  userStats,
  theme,
}: FixedDepositsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const principal = userStats?.fixed_deposits ?? 0;
  const isDark = theme === "dark";

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
      {/* Iron vault section header */}
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded flex items-center justify-center"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #52525b 0%, #3f3f46 100%)"
              : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
            boxShadow: isDark
              ? "inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.4)"
              : "inset 0 1px 1px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)",
            border: isDark ? "1px solid #3f3f46" : "1px solid #4b5563",
          }}
        >
          <Landmark className="h-3 w-3" style={{ color: isDark ? "#a1a1aa" : "#e5e7eb" }} />
        </div>
        <h3
          className="text-sm font-bold font-fantasy uppercase tracking-wider"
          style={{ color: isDark ? "#a1a1aa" : "#e5e7eb" }}
        >
          Fixed Deposits
        </h3>
      </div>
      <Card
        className="overflow-hidden relative py-0 gap-0"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 50%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
          borderColor: isDark
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(59, 130, 246, 0.15)",
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 40%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%)",
          }}
        />

        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-accent/20 transition-colors relative"
        >
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            <span
              className="text-sm font-bold font-mono"
              style={{
                textShadow: isDark
                  ? "0 0 12px rgba(59, 130, 246, 0.4)"
                  : "none",
              }}
            >
              ₹{Math.round(totalCurrentValue).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-green-500">
              +₹{Math.round(totalInterestEarned).toLocaleString("en-IN")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
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
              <div className="px-3 pb-3 relative">
                {/* Divider */}
                <div className="h-px bg-border/50 mb-3" />

                {/* FD Details */}
                <div className="space-y-3">
                  {fdCalculations.map((fd, index) => (
                    <div
                      key={index}
                      className="py-2 px-2.5 rounded bg-muted/30"
                    >
                      {/* Bank & Rate */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">{fd.bank}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {fd.rate}% p.a. • Matures {fd.maturityDateFormatted}
                        </span>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Principal
                          </p>
                          <p className="text-xs font-mono font-medium">
                            ₹{fd.principal.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Current
                          </p>
                          <p className="text-xs font-mono font-medium text-blue-500">
                            ₹
                            {Math.round(fd.currentValue).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            At Maturity
                          </p>
                          <p className="text-xs font-mono font-medium text-green-500 flex items-center justify-center gap-0.5">
                            <TrendingUp className="h-3 w-3" />₹
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
      </Card>
    </div>
  );
}
