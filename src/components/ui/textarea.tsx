import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Neo-brutalism: thick borders, sharp corners, bold styling
        "placeholder:text-muted-foreground",
        "flex field-sizing-content min-h-20 w-full rounded-lg",
        "border-2 border-black dark:border-white bg-white dark:bg-black/20",
        "px-3 py-2 text-base font-medium",
        "shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]",
        "transition-all outline-none",
        "md:text-sm",
        // Focus state - shift shadow
        "focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] focus-visible:shadow-[3px_3px_0_#1a1a1a] dark:focus-visible:shadow-[3px_3px_0_#FFFBF0]",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_hsl(var(--destructive))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
