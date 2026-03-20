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
    <nav
      className="md:hidden fixed left-5 right-5 z-[9999] no-view-transition rounded-2xl border border-neutral-200/50 bg-white/80 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/80"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))" }}
    >
      <div className="flex h-14 items-center">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticSelection();
              onViewChange(id);
            }}
            onPointerEnter={() => onPrefetch?.(id)}
            className="flex h-full flex-1 flex-col items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-muted/80 active:scale-95 dark:text-neutral-400"
          >
            <Icon className="h-5 w-5" />
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
