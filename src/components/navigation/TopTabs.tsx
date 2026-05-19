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
    <div className="bg-background">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3 h-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Back to home"
              className="text-muted-foreground hover:text-foreground transition-colors active:scale-95 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </span>
          </div>
          {rightContent && <div className="shrink-0">{rightContent}</div>}
        </div>
      </div>

      <div className="border-t border-zinc-300 dark:border-zinc-700">
        <div
          className="grid divide-x divide-zinc-300 dark:divide-zinc-700"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map(({ id, label }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(id)}
                className={cn(
                  "h-10 text-[10px] uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
