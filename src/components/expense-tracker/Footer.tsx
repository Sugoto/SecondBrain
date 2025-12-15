const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className="mt-6 pt-4 border-t border-border text-center text-muted-foreground text-[10px]">
      <p>
        © {CURRENT_YEAR}{" "}
        <span
          className="font-medium"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
            filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))",
          }}
        >
          Sugoto Basu
        </span>
      </p>
    </div>
  );
}

