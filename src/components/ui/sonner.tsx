import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/hooks/useTheme"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          background: isDark
            ? "rgba(24, 24, 27, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: isDark
            ? "1px solid rgba(63, 63, 70, 0.5)"
            : "1px solid rgba(228, 228, 231, 0.8)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          color: isDark ? "#fafafa" : "#18181b",
        },
        classNames: {
          toast: "rounded-xl",
          title: "font-medium",
          description: "text-muted-foreground",
          success: isDark
            ? "[background:rgba(34,197,94,0.15)_!important] [border-color:rgba(34,197,94,0.4)_!important] [&_svg]:text-green-400"
            : "[background:rgba(34,197,94,0.12)_!important] [border-color:rgba(34,197,94,0.3)_!important] [&_svg]:text-green-600",
          error: isDark
            ? "[background:rgba(239,68,68,0.15)_!important] [border-color:rgba(239,68,68,0.4)_!important] [&_svg]:text-red-400"
            : "[background:rgba(239,68,68,0.12)_!important] [border-color:rgba(239,68,68,0.3)_!important] [&_svg]:text-red-600",
        },
      }}
      style={
        {
          "--normal-bg": "transparent",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
