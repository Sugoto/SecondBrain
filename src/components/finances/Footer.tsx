const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className="mt-10 pt-6 pb-3 text-center border-t border-zinc-300 dark:border-zinc-700">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
        {CURRENT_YEAR}
        <span className="mx-2 text-muted-foreground/30">·</span>
        <span className="text-muted-foreground">Sugoto Basu</span>
      </p>
    </div>
  );
}
