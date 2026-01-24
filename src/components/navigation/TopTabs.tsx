import { memo, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { NavItem } from "./DynamicBottomNav";

interface TopTabsProps {
  navItems: NavItem[];
  activeView: string;
  onViewChange: (view: string) => void;
  onGoHome: () => void;
  title: string;
  accentColor?: string;
  rightContent?: ReactNode;
}

export const TopTabs = memo(function TopTabs({
  navItems,
  activeView,
  onViewChange,
  onGoHome,
  title,
  accentColor = "#8b5cf6",
  rightContent,
}: TopTabsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col">
      {/* Header row with back button, title, and optional right content */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 h-12">
        {/* Back to home button */}
        <button
          onClick={onGoHome}
          className="h-7 w-7 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: `${accentColor}20`,
          }}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: accentColor }} />
        </button>

        {/* Title */}
        <h1
          className="text-base font-semibold tracking-wide flex-1"
          style={{
            color: isDark ? "#e5e7eb" : "#1f2937",
          }}
        >
          {title}
        </h1>

        {/* Right content (e.g., date filter) */}
        {rightContent}
      </div>

      {/* Tabs row - equally spaced */}
      <div className="flex items-center px-2 h-10">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 transition-all"
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{
                  color: isActive ? accentColor : isDark ? "#71717a" : "#9ca3af",
                }}
              />
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{
                  color: isActive ? accentColor : isDark ? "#71717a" : "#6b7280",
                }}
              >
                {label}
              </span>

              {/* Active indicator line */}
              {isActive && (
                <div
                  className="absolute inset-x-2 -bottom-0 h-0.5 rounded-full"
                  style={{ background: accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div
        className="h-px"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, #3f3f46 20%, #3f3f46 80%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, #d1d5db 20%, #d1d5db 80%, transparent 100%)",
        }}
      />
    </div>
  );
});
