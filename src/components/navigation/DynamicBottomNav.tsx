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
      className="md:hidden fixed left-4 right-4 z-[9999] no-view-transition rounded-lg bg-pastel-orange border-[1.5px] border-black dark:border-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
      style={{ bottom: "max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.375rem))" }}
    >
      <div className="flex items-center h-11">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              hapticSelection();
              onViewChange(id);
            }}
            onPointerEnter={() => onPrefetch?.(id)}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all hover:scale-110 active:scale-95"
          >
            <Icon className="h-4 w-4 text-black dark:text-white" />
            <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wide text-black dark:text-white">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
