import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  iconGradient: string;
  iconShadow: string;
  /** Primary color for the background gradient (hex format, e.g. "#8b5cf6") */
  accentColor?: string;
  /** If true, removes the background gradient */
  noBackground?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  icon: Icon,
  iconGradient,
  iconShadow,
  accentColor: _accentColor = "#8b5cf6",
  noBackground = false,
  children,
}: PageHeaderProps) {
  // accentColor reserved for future use
  void _accentColor;
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Clean button style with subtle amethyst accent
  const buttonStyle = {
    background: isDark
      ? "rgba(139, 92, 246, 0.15)"
      : "rgba(139, 92, 246, 0.08)",
    border: isDark
      ? "1px solid rgba(139, 92, 246, 0.3)"
      : "1px solid rgba(139, 92, 246, 0.2)",
    boxShadow: isDark
      ? "0 2px 8px rgba(0, 0, 0, 0.3)"
      : "0 2px 8px rgba(0, 0, 0, 0.05)",
  };

  return (
    <div
      className={`relative overflow-hidden ${noBackground ? "" : "px-4 py-4 -mx-4 -mt-4 -mb-4"}`}
      style={
        noBackground
          ? undefined
          : {
              background: isDark
                ? "rgba(20, 20, 22, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              borderBottom: isDark
                ? "1px solid rgba(139, 92, 246, 0.15)"
                : "1px solid rgba(0, 0, 0, 0.06)",
            }
      }
    >
      {/* Subtle animated glow */}
      {!noBackground && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${isDark ? "rgba(139, 92, 246, 0.06)" : "rgba(139, 92, 246, 0.04)"} 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 50%, ${isDark ? "rgba(139, 92, 246, 0.06)" : "rgba(139, 92, 246, 0.04)"} 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${isDark ? "rgba(139, 92, 246, 0.06)" : "rgba(139, 92, 246, 0.04)"} 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* RPG-style icon container with ornate border */}
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center relative"
            style={{
              background: iconGradient,
              boxShadow: `${iconShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <Icon className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          {/* Fantasy heading font */}
          <h1 className="text-xl font-semibold tracking-wide font-fantasy">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {children}

          {/* Theme Toggle - Day/Night cycle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={buttonStyle}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-violet-400" />
            ) : (
              <Moon className="h-4 w-4 text-violet-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

