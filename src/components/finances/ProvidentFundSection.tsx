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
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Provident Funds
      </h3>
      <div className="overflow-hidden rounded-xl border-2 border-black dark:border-white bg-card shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]">
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-pastel-yellow/30"
        >
          <span className="text-base font-bold font-mono text-foreground">
            ₹{total.toLocaleString("en-IN")}
          </span>
          <div className="h-7 w-7 rounded-md bg-white dark:bg-white/10 border-2 border-black dark:border-white flex items-center justify-center">
            <ChevronDown
              className={`h-4 w-4 text-black dark:text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
              <div className="px-4 pb-4">
                {/* Divider */}
                <div className="h-0.5 bg-black/10 dark:bg-white/10 mb-4" />

                {/* Progress Bar */}
                <div className="h-3 rounded-full overflow-hidden flex bg-white dark:bg-white/10 border-2 border-black/20 dark:border-white/20 mb-3">
                  {ppf > 0 && (
                    <div
                      className="h-full bg-black dark:bg-white"
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
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-pastel-blue/50 border border-black/10 dark:border-white/10">
                      <div className="w-3 h-3 rounded-md bg-black dark:bg-white" />
                      <span className="text-xs font-bold text-muted-foreground">PPF</span>
                      <span className="text-sm font-mono font-bold text-foreground">₹{ppf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {epf > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-pastel-purple/50 border border-black/10 dark:border-white/10">
                      <div
                        className="w-3 h-3 rounded-md"
                        style={{ background: isDark ? "#71717a" : "#a1a1aa" }}
                      />
                      <span className="text-xs font-bold text-muted-foreground">EPF</span>
                      <span className="text-sm font-mono font-bold text-foreground">₹{epf.toLocaleString("en-IN")}</span>
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
