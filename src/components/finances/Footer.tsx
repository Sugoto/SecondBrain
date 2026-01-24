import { useTheme } from "@/hooks/useTheme";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="relative mt-6 pt-6 pb-2 text-center"
      style={{
        borderTop: isDark ? "1px solid #3f3f46" : "1px solid #4b5563",
      }}
    >
      {/* Iron bolt ornament at top */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
        <div
          className="h-0.5 w-8 rounded-full"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent, #52525b)"
              : "linear-gradient(90deg, transparent, #6b7280)",
          }}
        />
        <div
          className="h-3 w-3 rounded-full"
          style={{
            background: isDark
              ? "radial-gradient(circle at 30% 30%, #71717a 0%, #3f3f46 60%, #27272a 100%)"
              : "radial-gradient(circle at 30% 30%, #d1d5db 0%, #6b7280 60%, #374151 100%)",
            boxShadow: isDark
              ? "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.5)"
              : "inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)",
            border: isDark ? "1px solid #52525b" : "1px solid #4b5563",
          }}
        />
        <div
          className="h-0.5 w-8 rounded-full"
          style={{
            background: isDark
              ? "linear-gradient(90deg, #52525b, transparent)"
              : "linear-gradient(90deg, #6b7280, transparent)",
          }}
        />
      </div>

      <p
        className="text-[10px] font-fantasy tracking-wide"
        style={{ color: isDark ? "#71717a" : "#9ca3af" }}
      >
        Forged in {CURRENT_YEAR} by{" "}
        <span
          className="font-semibold"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #a1a1aa 0%, #d4d4d8 100%)"
              : "linear-gradient(135deg, #e5e7eb 0%, #f9fafb 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Sugoto Basu
        </span>
      </p>
    </div>
  );
}

