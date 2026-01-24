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

  // Wooden tavern sign navigation with medieval RPG aesthetics
  const containerStyle = useMemo(
    () => ({
      // Wood grain background
      background: isDark
        ? `linear-gradient(180deg, 
            #3d2a1c 0%, 
            #2d1f14 40%, 
            #2a1e12 60%, 
            #241a0f 100%)`
        : `linear-gradient(180deg, 
            #a0785c 0%, 
            #8B5A2B 40%, 
            #7a4f24 60%, 
            #6d4520 100%)`,
      border: isDark
        ? "2px solid #1a1208"
        : "2px solid #5D3A1A",
      boxShadow: isDark
        ? "inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0, 0, 0, 0.6)"
        : "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.15), 0 4px 20px rgba(0, 0, 0, 0.25)",
      borderRadius: "12px",
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
      {/* Wood grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[10px] overflow-hidden opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.08) 3px,
            rgba(0,0,0,0.08) 5px
          )`,
        }}
      />

      {/* Metal trim/bracket effect at top */}
      <div
        className="absolute inset-x-4 top-0 h-1 pointer-events-none rounded-t-[8px] overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, #5d4530 20%, #8b6914 50%, #5d4530 80%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, #c9a66b 20%, #daa520 50%, #c9a66b 80%, transparent 100%)",
        }}
      />

      {/* Decorative corner nails */}
      <div
        className="absolute top-2 left-2 w-2 h-2 rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 30%, #6b7280 0%, #374151 100%)"
            : "radial-gradient(circle at 30% 30%, #9ca3af 0%, #6b7280 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}
      />
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 30%, #6b7280 0%, #374151 100%)"
            : "radial-gradient(circle at 30% 30%, #9ca3af 0%, #6b7280 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}
      />

      <div className="flex items-center h-14 relative">
        {/* Home button - Grimoire/Scroll styled as wax seal */}
        {showHomeButton && (
          <button
            onClick={onGoHome}
            className="flex items-center justify-center ml-3 active:scale-90 transition-transform rounded-full"
            style={{
              width: 32,
              height: 32,
              background: isDark
                ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              boxShadow: isDark
                ? "0 2px 6px rgba(139, 92, 246, 0.4)"
                : "0 2px 6px rgba(139, 92, 246, 0.3)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            <Scroll className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Divider when home button is shown - rope/chain style */}
        {showHomeButton && (
          <div
            className="h-8 w-px mx-2"
            style={{
              background: isDark
                ? "linear-gradient(180deg, transparent 0%, #5d4530 20%, #8b6914 50%, #5d4530 80%, transparent 100%)"
                : "linear-gradient(180deg, transparent 0%, #8b7355 20%, #c9a66b 50%, #8b7355 80%, transparent 100%)",
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
                {/* Active torch/magical glow effect */}
                {isActive && (
                  <div
                    className="absolute inset-x-2 -top-1 bottom-1 rounded-lg -z-10"
                    style={{
                      background: isDark
                        ? `radial-gradient(ellipse at center, ${itemColor}25 0%, transparent 70%)`
                        : `radial-gradient(ellipse at center, ${itemColor}20 0%, transparent 70%)`,
                      boxShadow: isDark
                        ? `0 0 12px ${itemColor}30`
                        : `0 0 8px ${itemColor}20`,
                    }}
                  />
                )}
                {/* Icon with magical bounce animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      // Home page: always show color. Subpages: only color when active
                      color: hasExplicitColor 
                        ? itemColor 
                        : isActive 
                          ? itemColor 
                          : isDark ? "#a89070" : "#f5e6c8",
                      filter: isActive 
                        ? `drop-shadow(0 0 6px ${itemColor}80)` 
                        : isDark 
                          ? "drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                          : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                    }}
                  />
                </motion.div>
                <span
                  className="text-[10px] mt-0.5 font-semibold tracking-wide uppercase"
                  style={{
                    color: isActive 
                      ? itemColor 
                      : isDark ? "#a89070" : "#f5e6c8",
                    fontFamily: '"Texturina", serif',
                    letterSpacing: "0.05em",
                    textShadow: isActive
                      ? `0 0 8px ${itemColor}60`
                      : isDark 
                        ? "0 1px 2px rgba(0,0,0,0.5)" 
                        : "0 1px 2px rgba(0,0,0,0.3)",
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
