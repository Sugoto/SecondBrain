import React, { memo } from "react";
import { createPortal } from "react-dom";
import { hapticSelection } from "@/hooks/useHaptics";

export interface NavItem {
  id: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
    strokeWidth?: number | string;
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
      className="md:hidden fixed inset-x-0 bottom-0 z-[9999] no-view-transition bg-background border-t border-outline-variant"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-14">
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
            className="group flex flex-1 flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-[0.2em] leading-none">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
