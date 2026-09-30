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

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<"dialog"> & {
  showCloseButton?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
}) {
  const { open, onOpenChange } = useDialog();
  const ref = React.useRef<HTMLDialogElement>(null);

  const autoFocus = React.useEffectEvent((event: Event) => onOpenAutoFocus?.(event));

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
      className={cn(
        "bg-background text-foreground m-auto grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg outline-none sm:max-w-lg",
        className,
      )}
      {...props}
    >
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
