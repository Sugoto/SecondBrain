import { useState } from "react";
import { Card } from "@/components/ui/card";
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
      <h3 className="text-sm font-semibold text-muted-foreground">
        Provident Funds
      </h3>
      <Card className="overflow-hidden border border-border bg-card py-0 gap-0">
        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors hover:bg-accent/50"
        >
          <span className="text-sm font-bold font-mono">
            ₹{total.toLocaleString("en-IN")}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
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
                <div className="h-px bg-border mb-3" />

                {/* Progress Bar */}
                <div className="h-2 rounded-full overflow-hidden flex bg-muted mb-2">
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
                <div className="flex items-center justify-between text-[10px]">
                  {ppf > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                      <span className="text-muted-foreground">PPF</span>
                      <span className="font-mono">₹{ppf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {epf > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: isDark ? "#71717a" : "#a1a1aa" }}
                      />
                      <span className="text-muted-foreground">EPF</span>
                      <span className="font-mono">₹{epf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
