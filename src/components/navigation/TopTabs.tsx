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
    <div className="flex flex-col px-4 pt-2 pb-1.5 h-[72px]">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2 h-6">
        {/* Back button */}
        <button
          onClick={onGoHome}
          className="h-6 w-6 rounded-md flex items-center justify-center border-[1.5px] border-black dark:border-white bg-pastel-pink transition-all hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[1.5px_1.5px_0_#1a1a1a] dark:hover:shadow-[1.5px_1.5px_0_#FFFBF0]"
        >
          <ChevronLeft className="h-3 w-3 text-black dark:text-white" />
        </button>

        {/* Title */}
        <h1 className="text-sm font-bold text-foreground flex-1">
          {title}
        </h1>

        {/* Right content */}
        {rightContent}
      </div>

      {/* Full-width tabs - neo-brutalism style (compact) */}
      <div className="flex items-center gap-1.5">
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border-[1.5px]",
                isActive
                  ? "bg-pastel-purple border-black dark:border-white text-black dark:text-white shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0]"
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
