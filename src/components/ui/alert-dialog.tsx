import * as React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, useDialog } from "@/components/ui/dialog";

const AlertDialog = Dialog;

function AlertDialogContent(props: React.ComponentProps<typeof DialogContent>) {
  return <DialogContent role="alertdialog" showCloseButton={false} {...props} />;
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = useDialog();
  return (
    <button
      type="button"
      className={cn(buttonVariants(), className)}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = useDialog();
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "outline" }), className)}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
