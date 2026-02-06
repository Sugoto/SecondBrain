import { memo, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import type { NavItem } from "./DynamicBottomNav";
import { cn } from "@/lib/utils";

interface TopTabsProps {
  navItems: NavItem[];
  activeView: string;
  onViewChange: (view: string) => void;
  onGoHome: () => void;
  title: string;
  rightContent?: ReactNode;
}

export const TopTabs = memo(function TopTabs({
  navItems,
  activeView,
  onViewChange,
  onGoHome,
  title,
  rightContent,
}: TopTabsProps) {
  return (
    <div className="flex flex-col px-5 pt-3 pb-2 h-[88px]">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3 h-7">
        {/* Back button */}
        <button
          onClick={onGoHome}
          className="h-8 w-8 rounded-lg flex items-center justify-center border-2 border-black dark:border-white bg-pastel-pink transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0]"
        >
          <ChevronLeft className="h-4 w-4 text-black dark:text-white" />
        </button>

        {/* Title */}
        <h1 className="text-lg font-bold text-foreground flex-1">
          {title}
        </h1>

        {/* Right content */}
        {rightContent}
      </div>

      {/* Full-width tabs - neo-brutalism style */}
      <div className="flex items-center gap-2">
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border-2",
                isActive
                  ? "bg-pastel-purple border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
