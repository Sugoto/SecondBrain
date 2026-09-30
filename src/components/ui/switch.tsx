import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  checked = false,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<"button">, "role" | "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const state = checked ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-state={state}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        "border border-border",
        "transition-colors outline-none",
        "data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted",
        "focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={state}
        className={cn(
          "pointer-events-none block size-4 rounded-full",
          "bg-background shadow-sm",
          "ring-0 transition-transform",
          "data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=unchecked]:translate-x-0.5",
        )}
      />
    </button>
  );
}

export { Switch };
