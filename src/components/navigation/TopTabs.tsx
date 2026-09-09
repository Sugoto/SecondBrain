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
    <div className="ui-type bg-[var(--ui-page)] px-4 pt-4 pb-3">
      <div className="flex h-9 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Back to home"
            className="-ml-2 shrink-0 rounded-lg p-2 text-[var(--ui-ink-softer)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)] active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h1 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[var(--ui-ink)]">
            {title}
          </h1>
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>

      <div
        role="tablist"
        aria-label={`${title} views`}
        className="ui-inset mt-3 grid gap-1 p-1"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
        }}
      >
        {navItems.map(({ id, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(id)}
              className={cn(
                "h-9 rounded-[7px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-ink-softer)]",
                isActive
                  ? "bg-[var(--ui-panel)] font-medium text-[var(--ui-accent)] shadow-[var(--ui-lift)]"
                  : "text-[var(--ui-ink-softer)] hover:text-[var(--ui-ink)]",
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
