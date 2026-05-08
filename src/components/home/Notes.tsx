import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";

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
    <div className="bg-card border border-outline-variant rounded-2xl px-5 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        <NotebookPen className="h-3.5 w-3.5 text-foreground" />
        <span className="text-label-m text-foreground">Notes</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot anything down…"
        className="w-full min-h-32 resize-none bg-transparent text-body-m text-foreground placeholder:text-muted-foreground outline-none"
      />
    </div>
  );
}
