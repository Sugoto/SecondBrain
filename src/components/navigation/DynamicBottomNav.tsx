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
    <nav className="md:hidden fixed bottom-4 left-5 right-5 z-[9999] no-view-transition rounded-xl bg-pastel-orange border-2 border-black dark:border-white shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#FFFBF0]">
      <div className="flex items-center h-14">
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
            <Icon className="h-5 w-5 text-black dark:text-white" />
            <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wide text-black dark:text-white">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body
  );
});
