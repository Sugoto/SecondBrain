// Value rating labels for the 1-5 "was it worth it" scale
export const VALUE_RATING_LABELS: Record<number, string> = {
  1: "Regret",
  2: "Meh",
  3: "Fine",
  4: "Good",
  5: "Worth it",
};

// Subtle background tint for a 1-5 value rating - blends a hue
// (red at 1, green at 5) into the current theme background.
//
// Mixed in oklab (Cartesian a/b), not oklch (polar hue angle): --background
// isn't perfectly gray (oklch(.. 0.005 275), a faint blue-violet), and polar
// hue interpolation would weight that stray 275° hue by its full 93% share
// regardless of how little chroma it carries - dragging every rating's tint
// toward blue/purple instead of red-to-green. oklab interpolates a/b
// linearly, so a near-zero-chroma background barely perturbs the result.
export function getValueRatingTint(
  rating: number | null,
  mixPercent = 7,
): string {
  if (!rating) return "var(--background)";
  const clamped = Math.min(5, Math.max(1, rating));
  const hue = 25 + ((clamped - 1) / 4) * (145 - 25);
  return `color-mix(in oklab, var(--background) ${100 - mixPercent}%, oklch(60% 0.15 ${hue}) ${mixPercent}%)`;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Compact currency format for cards (1k, 2.5k, 1L, etc.)
export const formatCurrencyCompact = (amount: number) => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 100000) {
    // Lakhs: 1L, 1.5L, etc.
    const lakhs = absAmount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    // Thousands: 1k, 2.5k, 10k, etc.
    const thousands = absAmount / 1000;
    return `₹${
      thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    }k`;
  }

  // Regular format for smaller amounts (under 1000)
  return `₹${Math.round(absAmount)}`;
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const formatTime = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(":")) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
};
