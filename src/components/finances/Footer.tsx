const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className="relative mt-8 pt-6 pb-2 text-center border-t-2 border-black/10 dark:border-white/10">
      <p className="text-xs text-muted-foreground tracking-wide font-medium">
        {CURRENT_YEAR} •{" "}
        <span className="font-bold text-foreground">
          Sugoto Basu
        </span>
      </p>
    </div>
  );
}
