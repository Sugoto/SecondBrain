import React, { memo, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Scroll } from "lucide-react";
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

  // Clean navigation with amethyst accents
  const containerStyle = useMemo(
    () => ({
      background: isDark
        ? "rgba(20, 20, 22, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px) saturate(150%)",
      WebkitBackdropFilter: "blur(20px) saturate(150%)",
      border: isDark
        ? "1px solid rgba(139, 92, 246, 0.2)"
        : "1px solid rgba(0, 0, 0, 0.08)",
      boxShadow: isDark
        ? "0 -4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
        : "0 -4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      borderRadius: "16px",
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
      {/* Top amethyst trim effect */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none rounded-t-[16px] overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 10%, rgba(139, 92, 246, 0.4) 50%, transparent 90%)"
            : "linear-gradient(90deg, transparent 10%, rgba(139, 92, 246, 0.3) 50%, transparent 90%)",
        }}
      />

      <div className="flex items-center h-14 relative">
        {/* Home button - Grimoire/Scroll */}
        {showHomeButton && (
          <button
            onClick={onGoHome}
            className="flex items-center justify-center ml-2 active:scale-90 transition-transform"
            style={{
              width: 36,
              height: 36,
              color: isDark ? "rgba(139, 92, 246, 0.8)" : "rgba(109, 40, 217, 0.7)",
            }}
          >
            <Scroll className="h-5 w-5" />
          </button>
        )}

        {/* Divider when home button is shown */}
        {showHomeButton && (
          <div
            className="h-6 w-px mx-1"
            style={{
              background: isDark
                ? "linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.3), transparent)"
                : "linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.2), transparent)",
            }}
          />
        )}

        {/* Nav items container - RPG menu tabs */}
        <div className="flex items-center justify-around flex-1 h-full">
          {navItems.map(({ id, icon: Icon, label, color }) => {
            const isActive = activeView === id;
            // Section colors: cyan for arcane, amethyst for treasury, red for vitality
            const sectionColor = 
              currentSection === "omscs" ? "#06b6d4" :
              currentSection === "finances" ? "#8b5cf6" :
              "#ef4444";
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
                {/* Active rune glow effect */}
                {isActive && (
                  <div
                    className="absolute inset-x-4 -top-1 bottom-2 rounded-lg -z-10"
                    style={{
                      background: isDark
                        ? `radial-gradient(ellipse at center top, ${itemColor}30 0%, transparent 70%)`
                        : `radial-gradient(ellipse at center top, ${itemColor}20 0%, transparent 70%)`,
                    }}
                  />
                )}
                {/* Icon with magical bounce animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -3 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      // Home page: always show color. Subpages: only color when active
                      color: hasExplicitColor ? itemColor : (isActive ? itemColor : undefined),
                      filter: isActive ? `drop-shadow(0 2px 4px ${itemColor}60)` : undefined,
                    }}
                  />
                </motion.div>
                <span
                  className="text-[10px] mt-0.5 font-medium tracking-wide"
                  style={{
                    color: isActive ? itemColor : "var(--muted-foreground)",
                    fontFamily: '"Texturina", serif',
                    letterSpacing: "0.02em",
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
