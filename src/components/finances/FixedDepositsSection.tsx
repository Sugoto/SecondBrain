import { Card } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import type { UserStats } from "@/lib/supabase";

interface FixedDepositsSectionProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function FixedDepositsSection({ userStats, theme }: FixedDepositsSectionProps) {
  const amount = userStats?.fixed_deposits ?? 0;
  const isDark = theme === "dark";

  if (amount === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Fixed Deposits</h3>
      <Card 
        className="px-3 py-2 relative overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 50%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
          borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)",
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
        
        <div className="relative flex items-center gap-2">
          <Landmark className="h-4 w-4 text-blue-500" />
          <span 
            className="text-sm font-bold font-mono"
            style={{
              textShadow: isDark ? "0 0 12px rgba(59, 130, 246, 0.4)" : "none",
            }}
          >
            ₹{amount.toLocaleString("en-IN")}
          </span>
        </div>
      </Card>
    </div>
  );
}
