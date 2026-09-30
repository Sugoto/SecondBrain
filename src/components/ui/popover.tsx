import * as React from "react";

import { cn } from "@/lib/utils";

type PopoverState = {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const PopoverContext = React.createContext<PopoverState>({ id: "" });

function Popover({
  open,
  onOpenChange,
  children,
}: Omit<PopoverState, "id"> & { children?: React.ReactNode }) {
  const id = React.useId();
  const state = React.useMemo(() => ({ id, open, onOpenChange }), [id, open, onOpenChange]);
  return <PopoverContext value={state}>{children}</PopoverContext>;
}

function PopoverTrigger({ style, ...props }: React.ComponentProps<"button">) {
  const { id } = React.useContext(PopoverContext);
  return (
    <button
      type="button"
      data-slot="popover-trigger"
      popoverTarget={id}
      style={{ anchorName: `--${id}`, ...style }}
      {...props}
    />
  );
}

const AREAS = { start: "bottom span-right", center: "bottom", end: "bottom span-left" };

function PopoverContent({
  className,
  style,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<"div"> & { align?: keyof typeof AREAS; sideOffset?: number }) {
  const { id, open, onOpenChange } = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open !== undefined) ref.current?.togglePopover(open);
  }, [open]);

  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      data-slot="popover-content"
      onToggle={(e) => onOpenChange?.((e.nativeEvent as ToggleEvent).newState === "open")}
      style={{
        positionAnchor: `--${id}`,
        positionArea: AREAS[align],
        positionTryFallbacks: "flip-block",
        marginTop: sideOffset,
        ...style,
      }}
      className={cn(
        "bg-popover text-popover-foreground inset-auto m-0 w-72 rounded-md border p-4 shadow-md outline-hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Popover, PopoverTrigger, PopoverContent };
