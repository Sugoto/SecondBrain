// Value rating labels for the 1-5 "was it worth it" scale
export const VALUE_RATING_LABELS: Record<number, string> = {
  1: "Regret",
  2: "Meh",
  3: "Expected",
  4: "Satisfied",
  5: "Valuable",
};

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
    return `₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }

  // Regular format for smaller amounts (under 1000)
  return `₹${Math.round(absAmount)}`;
};

/** Reads a `YYYY-MM-DD` date without going through Date, which would treat a
 *  bare date string as UTC midnight and shift the day in some timezones. */
export const formatDayLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return Temporal.PlainDate.from({ year: y, month: m, day: d }).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
