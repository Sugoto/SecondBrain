import { useEffect, useState } from "react";

const STORAGE_KEY = "home-notes";

export function Notes() {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, value);
  }, [value]);

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
        Notes
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot anything down…"
        className="w-full min-h-40 resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none"
      />
    </div>
  );
}
