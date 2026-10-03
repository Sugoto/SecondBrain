import * as React from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DialogState = { open: boolean; onOpenChange: (open: boolean) => void };

const DialogContext = React.createContext<DialogState>({ open: false, onOpenChange: () => {} });

const useDialog = () => React.useContext(DialogContext);

function Dialog({
  open = false,
  onOpenChange = () => {},
  children,
}: Partial<DialogState> & { children?: React.ReactNode }) {
  const state = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <DialogContext value={state}>{children}</DialogContext>;
}

const isOutside = (e: React.MouseEvent<HTMLDialogElement>) => {
  const { left, right, top, bottom } = e.currentTarget.getBoundingClientRect();
  return e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom;
};

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;

function useSheetGestures(
  ref: React.RefObject<HTMLDialogElement | null>,
  enabled: boolean,
  open: boolean,
  close: () => void,
) {
  React.useEffect(() => {
    const dialog = ref.current;
    const viewport = window.visualViewport;
    if (!enabled || !open || !dialog || !viewport) return;
    const sync = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      dialog.style.setProperty("--kb", `${inset}px`);
    };
    sync();
    viewport.addEventListener("resize", sync);
    return () => viewport.removeEventListener("resize", sync);
  }, [ref, enabled, open]);

  const onPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = e.currentTarget;
    const target = e.target as Element;
    if (!enabled || !target.closest("[data-sheet-drag]")) return;
    if (target.closest("input, textarea, select, button, a")) return;

    const startY = e.clientY;
    const startTime = e.timeStamp;
    let distance = 0;
    dialog.setPointerCapture(e.pointerId);
    dialog.dataset.dragging = "";

    const move = (ev: PointerEvent) => {
      distance = Math.max(0, ev.clientY - startY);
      dialog.style.translate = `0 ${distance}px`;
    };
    const end = (ev: PointerEvent) => {
      dialog.removeEventListener("pointermove", move);
      dialog.removeEventListener("pointerup", end);
      dialog.removeEventListener("pointercancel", end);
      delete dialog.dataset.dragging;
      dialog.style.translate = "";
      const velocity = distance / Math.max(1, ev.timeStamp - startTime);
      if (distance > DISMISS_DISTANCE || (distance > 24 && velocity > DISMISS_VELOCITY)) close();
    };
    dialog.addEventListener("pointermove", move);
    dialog.addEventListener("pointerup", end);
    dialog.addEventListener("pointercancel", end);
  };

  return { onPointerDown };
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  sheet = false,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<"dialog"> & {
  showCloseButton?: boolean;
  sheet?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
}) {
  const { open, onOpenChange } = useDialog();
  const ref = React.useRef<HTMLDialogElement>(null);

  const autoFocus = React.useEffectEvent((event: Event) => onOpenAutoFocus?.(event));
  const gestures = useSheetGestures(ref, sheet, open, () => onOpenChange(false));

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      dialog.close();
    } else if (!dialog.open) {
      const event = new Event("openautofocus", { cancelable: true });
      autoFocus(event);
      dialog.autofocus = event.defaultPrevented;
      dialog.showModal();
      if (event.defaultPrevented) {
        const park = () => {
          const active = document.activeElement;
          if (active instanceof HTMLElement && active !== dialog && dialog.contains(active)) {
            active.blur();
          }
          dialog.focus({ preventScroll: true });
        };
        park();
        const frame = requestAnimationFrame(park);
        return () => cancelAnimationFrame(frame);
      }
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      data-slot="dialog-content"
      data-state={open ? "open" : "closed"}
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && isOutside(e)) onOpenChange(false);
      }}
      onPointerDown={sheet ? gestures.onPointerDown : undefined}
      className={cn(
        "bg-background text-foreground m-auto grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg outline-none sm:max-w-lg",
        sheet &&
          "ui-sheet mx-auto mt-auto mb-[var(--kb,0px)] max-h-[calc(92dvh-var(--kb,0px))] max-w-md rounded-t-[24px] rounded-b-none border-b-0 sm:max-w-md",
        className,
      )}
      {...props}
    >
      {sheet && (
        <div
          data-sheet-drag
          className="flex h-6 shrink-0 cursor-grab touch-none justify-center pt-2.5"
        >
          <span aria-hidden className="h-1 w-9 rounded-full bg-[var(--ui-edge)]" />
        </div>
      )}
      {children}
      {showCloseButton && (
        <button
          type="button"
          data-slot="dialog-close"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 h-7 w-7 rounded-full border border-border bg-muted flex items-center justify-center transition-colors hover:bg-accent focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <XIcon className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </dialog>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, useDialog };
