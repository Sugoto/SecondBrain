import { motion } from "framer-motion";
import { TrendingUp, Wallet, LayoutGrid } from "lucide-react";
import type { ActiveView } from "./types";
import { useTheme } from "@/hooks/useTheme";

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const NAV_ITEMS = [
  { view: "trends" as const, icon: TrendingUp, label: "Trends" },
  { view: "expenses" as const, icon: Wallet, label: "Expenses" },
  { view: "categories" as const, icon: LayoutGrid, label: "Categories" },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const { theme } = useTheme();
  
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        background: theme === "dark" 
          ? "rgba(24, 24, 27, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: theme === "dark"
          ? "1px solid rgba(63, 63, 70, 0.5)"
          : "1px solid rgba(228, 228, 231, 0.8)",
        boxShadow: theme === "dark"
          ? "0 -4px 24px rgba(0, 0, 0, 0.3)"
          : "0 -4px 24px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Top shine effect */}
      <div 
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: theme === "dark"
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 50%, transparent)",
        }}
      />
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
          <motion.button
            key={view}
            onClick={() => onViewChange(view)}
            whileTap={{ scale: 0.9 }}
            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeView === view ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {/* Active background glow */}
            {activeView === view && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-x-4 -top-1 bottom-2 rounded-xl -z-10"
                style={{
                  background: theme === "dark"
                    ? "radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
                    : "radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              animate={{
                scale: activeView === view ? 1.1 : 1,
                y: activeView === view ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <span className="text-[10px] mt-0.5">{label}</span>
            {activeView === view && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                  boxShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}

