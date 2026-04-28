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
    <div className="flex h-[72px] flex-col px-4 pt-2 pb-1.5">
      <div className="mb-1.5 flex min-h-8 items-center gap-2">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Back to home"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>

        <h1 className="flex-1 text-title-m text-foreground truncate">{title}</h1>

        {rightContent}
      </div>

      <div className="flex items-center bg-surface-container rounded-full p-0.5">
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={cn(
                "flex-1 rounded-full px-2 py-1 text-label-m transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
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
