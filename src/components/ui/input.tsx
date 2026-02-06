import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Neo-brutalism: thick borders, sharp corners, bold styling
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "h-10 w-full min-w-0 rounded-lg border-2 border-black dark:border-white bg-white dark:bg-black/20 px-3 py-1 text-base font-medium",
        "shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]",
        "transition-all outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        // Focus state - shift shadow
        "focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] focus-visible:shadow-[3px_3px_0_#1a1a1a] dark:focus-visible:shadow-[3px_3px_0_#FFFBF0]",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_hsl(var(--destructive))]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
