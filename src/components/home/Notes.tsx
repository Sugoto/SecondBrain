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
    <section className="ui-panel overflow-hidden focus-within:border-[var(--ui-ink-softer)]">
      <h2 className="px-5 pt-5 text-[13px] font-medium text-[var(--ui-accent)]">Notes</h2>
      <label className="sr-only" htmlFor="home-notes">
        Notes
      </label>
      <textarea
        id="home-notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="ui-ruled mt-3 min-h-44 w-full resize-none bg-transparent px-5 pb-5 text-[15px] text-foreground outline-none placeholder:text-[var(--ui-ink-softer)]"
      />
    </section>
  );
}
