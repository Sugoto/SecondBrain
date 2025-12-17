import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  iconGradient: string;
  iconShadow: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  icon: Icon,
  iconGradient,
  iconShadow,
  children,
}: PageHeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const buttonStyle = {
    background: isDark
      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)",
    border: isDark
      ? "1px solid rgba(139, 92, 246, 0.3)"
      : "1px solid rgba(139, 92, 246, 0.25)",
    boxShadow: isDark
      ? "0 2px 8px rgba(139, 92, 246, 0.2)"
      : "0 2px 8px rgba(139, 92, 246, 0.1)",
  };

  return (
    <div className="flex items-center justify-between">
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
            <Sun className="h-4 w-4 text-primary" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>
    </div>
  );
}

