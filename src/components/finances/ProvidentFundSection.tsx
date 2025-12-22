import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import type { UserStats } from "@/lib/supabase";

interface ProvidentFundSectionProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function ProvidentFundSection({ userStats, theme }: ProvidentFundSectionProps) {
  const ppf = userStats?.ppf ?? 0;
  const epf = userStats?.epf ?? 0;
  const total = ppf + epf;
  const isDark = theme === "dark";

  if (total === 0) return null;

  const ppfPercent = total > 0 ? (ppf / total) * 100 : 0;
  const epfPercent = total > 0 ? (epf / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Provident Fund</h3>
      
      <Card 
        className="px-3 py-2 relative overflow-hidden"
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

        {/* Total */}
        <div className="relative flex items-center justify-between">
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
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden flex bg-muted/30">
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
        <div className="relative flex items-center justify-between text-[10px]">
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
      </Card>
    </div>
  );
}
