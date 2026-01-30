const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className="relative mt-6 pt-6 pb-2 text-center border-t border-border">
      <p className="text-[10px] text-muted-foreground tracking-wide">
        {CURRENT_YEAR} •{" "}
        <span className="font-medium text-foreground">
          Sugoto Basu
        </span>
      </p>
    </div>
  );
}
