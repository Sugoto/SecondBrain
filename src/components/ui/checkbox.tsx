"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Neo-brutalism: thick borders, sharp corners, bold colors
        "peer size-5 shrink-0 rounded-md",
        "border-2 border-black dark:border-white",
        "bg-white dark:bg-black/20",
        "shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]",
        "transition-all outline-none",
        // Checked state
        "data-[state=checked]:bg-pastel-blue data-[state=checked]:text-black",
        // Focus state
        "focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] focus-visible:shadow-[3px_3px_0_#1a1a1a] dark:focus-visible:shadow-[3px_3px_0_#FFFBF0]",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_hsl(var(--destructive))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
