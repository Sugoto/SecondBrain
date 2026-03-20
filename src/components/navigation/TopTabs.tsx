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
    <div className="flex h-[72px] flex-col px-4 pb-1.5 pt-2">
      {/* Header row */}
      <div className="mb-2 flex min-h-8 items-center gap-2">
        {/* Back button */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>

        {/* Title */}
        <h1 className="flex-1 text-sm font-semibold text-foreground">{title}</h1>

        {/* Right content */}
        {rightContent}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
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
