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
      className="no-view-transition fixed inset-x-0 bottom-0 z-[9999] px-4 pt-2 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <div className="ui-plate ui-type flex h-[60px] items-stretch rounded-[18px] shadow-[0_10px_30px_-12px_oklch(20%_0.04_275/0.45)]">
        {navItems.map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticSelection();
              onViewChange(id);
            }}
            onPointerEnter={() => onPrefetch?.(id)}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-none first:rounded-l-[18px] last:rounded-r-[18px] text-[var(--ui-plate-ink)] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--ui-plate-ink)] active:scale-[0.97]"
          >
            <Icon
              className="h-[19px] w-[19px]"
              strokeWidth={2}
              style={color ? { color } : undefined}
            />
            <span className="text-[11px] leading-none font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </nav>,
    document.body,
  );
});
