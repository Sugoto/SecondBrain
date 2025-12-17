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
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  icon: Icon,
  iconGradient,
  iconShadow,
  accentColor = "#8b5cf6",
  children,
}: PageHeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const buttonStyle = {
    background: isDark
      ? `linear-gradient(135deg, ${accentColor}26 0%, ${accentColor}1a 100%)`
      : `linear-gradient(135deg, ${accentColor}14 0%, ${accentColor}0d 100%)`,
    border: isDark
      ? `1px solid ${accentColor}4d`
      : `1px solid ${accentColor}40`,
    boxShadow: isDark
      ? `0 2px 8px ${accentColor}33`
      : `0 2px 8px ${accentColor}1a`,
  };

  return (
    <div
      className="relative px-4 py-4 -mx-4 -mt-4 -mb-4 overflow-hidden"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}0d 100%)`
          : `linear-gradient(135deg, ${accentColor}14 0%, ${accentColor}08 100%)`,
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, ${accentColor}${isDark ? '18' : '12'} 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 50%, ${accentColor}${isDark ? '18' : '12'} 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 50%, ${accentColor}${isDark ? '18' : '12'} 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: iconGradient,
              boxShadow: iconShadow,
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {children}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={buttonStyle}
          >
            {isDark ? (
              <Sun className="h-4 w-4" style={{ color: accentColor }} />
            ) : (
              <Moon className="h-4 w-4" style={{ color: accentColor }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

