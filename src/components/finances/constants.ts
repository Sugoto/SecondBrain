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

export const formatCurrencyCompact = (amount: number) => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    return `₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }

  return `₹${Math.round(absAmount)}`;
};

export const formatDayLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return Temporal.PlainDate.from({ year: y, month: m, day: d }).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
