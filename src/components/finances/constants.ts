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
