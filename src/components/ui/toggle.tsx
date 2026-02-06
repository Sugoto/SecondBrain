import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  // Neo-brutalism: thick borders, bold styling, offset shadows
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold border-2 border-black dark:border-white bg-white dark:bg-black/20 shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] hover:bg-pastel-yellow/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-pastel-blue data-[state=on]:text-black [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none transition-all focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] focus-visible:shadow-[3px_3px_0_#1a1a1a] dark:focus-visible:shadow-[3px_3px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-8 px-2 min-w-8",
        lg: "h-11 px-4 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
