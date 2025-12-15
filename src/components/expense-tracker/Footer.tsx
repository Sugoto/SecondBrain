const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className="mt-6 pt-4 border-t border-border text-center text-muted-foreground text-[10px]">
      <p>© {CURRENT_YEAR} Sugoto Basu</p>
    </div>
  );
}

