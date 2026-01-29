import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, ChevronDown } from "lucide-react";
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
          <Shield className="h-3 w-3" style={{ color: isDark ? "#a1a1aa" : "#e5e7eb" }} />
        </div>
        <h3
          className="text-sm font-bold font-fantasy uppercase tracking-wider"
          style={{ color: isDark ? "#a1a1aa" : "#e5e7eb" }}
        >
          Provident Funds
        </h3>
      </div>

      <Card 
        className="overflow-hidden relative py-0 gap-0"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, transparent 50%)"
            : "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 50%)",
          borderColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 40%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%)",
          }}
        />

        {/* Summary Header - Clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-accent/20 transition-colors relative"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-500" />
            <span 
              className="text-sm font-bold font-mono"
              style={{
                textShadow: isDark ? "0 0 12px rgba(139, 92, 246, 0.4)" : "none",
              }}
            >
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
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
              <div className="px-3 pb-3 relative">
                {/* Divider */}
                <div className="h-px bg-border/50 mb-3" />

                {/* Progress Bar */}
                <div className="h-2 rounded-full overflow-hidden flex bg-muted/30 mb-2">
                  {ppf > 0 && (
                    <div
                      className="h-full"
                      style={{ 
                        width: `${ppfPercent}%`,
                        background: "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)",
                        boxShadow: isDark ? "0 0 8px rgba(139, 92, 246, 0.5)" : "none",
                      }}
                    />
                  )}
                  {epf > 0 && (
                    <div
                      className="h-full"
                      style={{ 
                        width: `${epfPercent}%`,
                        background: "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                        boxShadow: isDark ? "0 0 8px rgba(99, 102, 241, 0.5)" : "none",
                      }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between text-[10px]">
                  {ppf > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)" }}
                      />
                      <span className="text-muted-foreground">PPF</span>
                      <span className="font-mono">₹{ppf.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {epf > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
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
