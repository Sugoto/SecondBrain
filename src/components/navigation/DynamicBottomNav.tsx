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
      aria-label="Primary"
      className="md:hidden fixed left-3 right-3 z-[9999] no-view-transition rounded-3xl border border-outline-variant bg-surface-container"
      style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))" }}
    >
      <div className="flex h-16 items-center px-1.5">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticSelection();
              onViewChange(id);
            }}
            onPointerEnter={() => onPrefetch?.(id)}
            aria-label={label}
            className="group flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors active:scale-95"
          >
            <span className="flex h-7 min-w-14 items-center justify-center rounded-full px-4 text-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-label-s text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
