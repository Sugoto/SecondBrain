import React, { memo } from "react";
import { createPortal } from "react-dom";
import { hapticSelection } from "@/hooks/useHaptics";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  color?: string;
  onPrefetch?: () => void;
}

interface DynamicBottomNavProps {
  navItems: NavItem[];
  onViewChange: (view: string) => void;
  hidden?: boolean;
  onPrefetch?: (id: string) => void;
}

export const DynamicBottomNav = memo(function DynamicBottomNav({
  navItems,
  onViewChange,
  hidden = false,
  onPrefetch,
}: DynamicBottomNavProps) {
  if (hidden) {
    return null;
  }

  return createPortal(
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[9999] no-view-transition rounded-lg border border-border bg-card dark:bg-zinc-900 shadow-lg">
      <div className="flex items-center h-12">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              hapticSelection();
              onViewChange(id);
            }}
            onPointerEnter={() => onPrefetch?.(id)}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors hover:bg-accent active:bg-accent"
          >
            <Icon className="h-4 w-4 text-foreground dark:text-white" />
            <span className="text-[9px] mt-0.5 font-medium uppercase tracking-wide text-foreground dark:text-white">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
