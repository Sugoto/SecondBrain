"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Neo-brutalism: thick borders, blocky shape, bold colors
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-lg",
        "border-2 border-black dark:border-white",
        "shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]",
        "transition-all outline-none",
        // Checked/unchecked backgrounds
        "data-[state=checked]:bg-pastel-green data-[state=unchecked]:bg-white dark:data-[state=unchecked]:bg-black/30",
        // Focus state
        "focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] focus-visible:shadow-[3px_3px_0_#1a1a1a] dark:focus-visible:shadow-[3px_3px_0_#FFFBF0]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Neo-brutalism thumb: square-ish with border
          "pointer-events-none block size-4 rounded-md",
          "border-2 border-black dark:border-white",
          "bg-white dark:bg-white",
          "ring-0 transition-transform",
          "data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
