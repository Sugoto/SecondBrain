import React, { memo, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { hapticSelection } from "@/hooks/useHaptics";
import type { AppSection } from "@/types/navigation";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  color?: string;
  onPrefetch?: () => void;
}

interface DynamicBottomNavProps {
  currentSection?: AppSection;
  activeView: string;
  navItems: NavItem[];
  onViewChange: (view: string) => void;
  onGoHome?: () => void;
  hidden?: boolean;
  onPrefetch?: (id: string) => void;
}

export const DynamicBottomNav = memo(function DynamicBottomNav({
  currentSection,
  activeView,
  navItems,
  onViewChange,
  onGoHome,
  hidden = false,
  onPrefetch,
}: DynamicBottomNavProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const showHomeButton = onGoHome && currentSection !== "home";

  // Memoize style objects to prevent recreation every render
  const containerStyle = useMemo(
    () => ({
      background: isDark
        ? "rgba(24, 24, 27, 0.75)"
        : "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      border: isDark
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.06)",
      boxShadow: isDark
        ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 0.5px rgba(255, 255, 255, 0.05)"
        : "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 0.5px rgba(255, 255, 255, 0.5)",
      borderRadius: "20px",
    }),
    [isDark]
  );

  // Hide instantly - no transition
  if (hidden) {
    return null;
  }

  // Use portal to render navbar outside React tree - completely isolates from View Transitions
  return createPortal(
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-[9999] no-view-transition"
      style={containerStyle}
    >
      {/* Top shine effect */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none rounded-t-[20px] overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)",
        }}
      />

      <div className="flex items-center h-14 relative">
        {/* Home button */}
        {showHomeButton && (
          <button
            onClick={onGoHome}
            className="flex items-center justify-center text-muted-foreground ml-2 active:scale-90"
            style={{
              width: 36,
              height: 36,
            }}
          >
            <Home className="h-5 w-5" />
          </button>
        )}

        {/* Divider when home button is shown */}
        {showHomeButton && (
          <div
            className="h-6 w-px mx-1"
            style={{
              background: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.08)",
            }}
          />
        )}

        {/* Nav items container */}
        <div className="flex items-center justify-around flex-1 h-full">
          {navItems.map(({ id, icon: Icon, label, color }) => {
            const isActive = activeView === id;
            // Items with explicit colors (home page) use their defined color
            // Otherwise use section-based theme: aqua for omscs, purple for finances, teal for time, orange for health
            const sectionColor = 
              currentSection === "omscs" ? "#06b6d4" :
              currentSection === "finances" ? "#8b5cf6" :
              currentSection === "time" ? "#14b8a6" : 
              "#f97316";
            const itemColor = color || sectionColor;
            const hasExplicitColor = !!color;

            return (
              <button
                key={id}
                onClick={() => {
                  if (isActive) return;
                  hapticSelection();
                  onViewChange(id);
                }}
                onPointerEnter={() => onPrefetch?.(id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                {/* Active background glow */}
                {isActive && (
                  <div
                    className="absolute inset-x-4 -top-1 bottom-2 rounded-xl -z-10"
                    style={{
                      background: isDark
                        ? `radial-gradient(ellipse at center top, ${itemColor}26 0%, transparent 70%)`
                        : `radial-gradient(ellipse at center top, ${itemColor}1a 0%, transparent 70%)`,
                    }}
                  />
                )}
                {/* Only the icon has animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      // Home page: always show color. Subpages: only color when active
                      color: hasExplicitColor ? itemColor : (isActive ? itemColor : undefined),
                    }}
                  />
                </motion.div>
                <span
                  className="text-[10px] mt-0.5"
                  style={{
                    color: isActive ? itemColor : "var(--muted-foreground)",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>,
    document.body
  );
});
