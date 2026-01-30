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
    <div className="flex flex-col px-4 pt-3 pb-2 h-[88px]">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3 h-7">
        {/* Back button */}
        <button
          onClick={onGoHome}
          className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:bg-muted active:bg-muted"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Title */}
        <h1 className="text-base font-semibold text-foreground flex-1">
          {title}
        </h1>

        {/* Right content */}
        {rightContent}
      </div>

      {/* Full-width tabs */}
      <div className="flex items-center gap-1">
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
