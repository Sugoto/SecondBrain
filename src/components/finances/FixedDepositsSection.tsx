import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Landmark, ChevronDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserStats } from "@/lib/supabase";

type FDConfig = {
  bank: string;
  rate: number;
  startDate: string;
  maturityDate: string;
  compoundingFrequency: number;
};

const FD_CONFIG: FDConfig[] = [
  {
    bank: "Axis Bank",
    rate: 7.25,
    startDate: "2025-02-08",
    maturityDate: "2026-05-08",
    compoundingFrequency: 4,
  },
];

function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  compoundingFrequency: number,
  years: number
): number {
  const r = annualRate / 100;
  const n = compoundingFrequency;
  return principal * Math.pow(1 + r / n, n * years);
}

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

  // Calculate current and maturity values for all FDs
  const fdCalculations = useMemo(() => {
    if (principal === 0) return [];

    const now = new Date();

    return FD_CONFIG.map((fd) => {
      const startDate = new Date(fd.startDate);
      const maturityDate = new Date(fd.maturityDate);

      // Calculate years elapsed since start
      const yearsElapsed = Math.max(
        0,
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );

      // Calculate total tenure in years
      const totalTenure =
        (maturityDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);

      // Current value based on time elapsed
      const currentValue = calculateCompoundInterest(
        principal,
        fd.rate,
        fd.compoundingFrequency,
        Math.min(yearsElapsed, totalTenure) // Don't exceed maturity
      );

      // Maturity value
      const maturityValue = calculateCompoundInterest(
        principal,
        fd.rate,
        fd.compoundingFrequency,
        totalTenure
      );

      // Interest earned so far
      const interestEarned = currentValue - principal;

      // Total interest at maturity
      const totalInterest = maturityValue - principal;

      return {
        ...fd,
        principal,
        currentValue,
        maturityValue,
        interestEarned,
        totalInterest,
        yearsElapsed,
        totalTenure,
        maturityDateFormatted: maturityDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
      };
    });
  }, [principal]);

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
      <h3 className="text-sm font-semibold">Fixed Deposits</h3>
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
