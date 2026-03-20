import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserStats } from "@/lib/supabase";

interface ProvidentFundSectionProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function ProvidentFundSection({ userStats, theme }: ProvidentFundSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ppf = userStats?.ppf ?? 0;
  const epf = userStats?.epf ?? 0;
  const total = ppf + epf;
  const isDark = theme === "dark";

  if (total === 0) return null;

  const ppfPercent = total > 0 ? (ppf / total) * 100 : 0;
  const epfPercent = total > 0 ? (epf / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Provident Funds
      </h3>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Summary Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left transition-colors hover:bg-muted"
        >
          <span className="text-sm font-bold font-mono text-foreground">
            ₹{total.toLocaleString("en-IN")}
          </span>
          <div className="h-5 w-5 rounded-lg flex items-center justify-center border border-border bg-muted">
            <ChevronDown
              className={`h-3 w-3 text-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
              <div className="px-3 pb-3">
                <div className="h-px bg-border mb-2" />

                {/* Progress Bar */}
                <div className="h-2 rounded-full overflow-hidden flex bg-muted border border-border mb-2">
                  {ppf > 0 && (
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${ppfPercent}%` }}
                    />
                  )}
                  {epf > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${epfPercent}%`,
                        background: isDark ? "#71717a" : "#a1a1aa",
                      }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between">
                  {ppf > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border">
                      <div className="w-2 h-2 rounded bg-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground">PPF</span>
                      <span className="text-xs font-mono font-bold text-foreground">₹{ppf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {epf > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border">
                      <div
                        className="w-2 h-2 rounded"
                        style={{ background: isDark ? "#71717a" : "#a1a1aa" }}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">EPF</span>
                      <span className="text-xs font-mono font-bold text-foreground">₹{epf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
