// Fixed Deposit configuration and calculation utilities

export type FDConfig = {
  bank: string;
  rate: number; // Annual interest rate in %
  startDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  compoundingFrequency: number; // Times per year (4 = quarterly)
};

// Configure your FDs here - principal comes from database
export const FD_CONFIG: FDConfig[] = [
  {
    bank: "Axis Bank",
    rate: 7.25,
    startDate: "2025-02-08",
    maturityDate: "2026-05-08",
    compoundingFrequency: 4, // Quarterly
  },
];

// Calculate compound interest: A = P(1 + r/n)^(nt)
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  compoundingFrequency: number,
  years: number,
): number {
  const r = annualRate / 100;
  const n = compoundingFrequency;
  return principal * Math.pow(1 + r / n, n * years);
}

export type FDCalculation = {
  bank: string;
  rate: number;
  principal: number;
  currentValue: number;
  maturityValue: number;
  interestEarned: number;
  totalInterest: number;
  yearsElapsed: number;
  totalTenure: number;
  maturityDateFormatted: string;
  startDate: string;
  maturityDate: string;
};

// Calculate current and maturity values for all FDs
export function calculateFDValues(principal: number): FDCalculation[] {
  if (principal === 0) return [];

  const now = new Date();

  return FD_CONFIG.map((fd) => {
    const startDate = new Date(fd.startDate);
    const maturityDate = new Date(fd.maturityDate);

    // Calculate years elapsed since start
    const yearsElapsed = Math.max(
      0,
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    );

    // Calculate total tenure in years
    const totalTenure =
      (maturityDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);

    // Current value based on time elapsed
    const currentValue = calculateCompoundInterest(
      principal,
      fd.rate,
      fd.compoundingFrequency,
      Math.min(yearsElapsed, totalTenure), // Don't exceed maturity
    );

    // Maturity value
    const maturityValue = calculateCompoundInterest(
      principal,
      fd.rate,
      fd.compoundingFrequency,
      totalTenure,
    );

    // Interest earned so far
    const interestEarned = currentValue - principal;

    // Total interest at maturity
    const totalInterest = maturityValue - principal;

    return {
      bank: fd.bank,
      rate: fd.rate,
      principal,
      currentValue,
      maturityValue,
      interestEarned,
      totalInterest,
      yearsElapsed,
      totalTenure,
      maturityDateFormatted: maturityDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      startDate: fd.startDate,
      maturityDate: fd.maturityDate,
    };
  });
}

// Get total current FD value (sum of all FDs)
export function getCurrentFDValue(principal: number): number {
  const calculations = calculateFDValues(principal);
  return calculations.reduce((sum, fd) => sum + fd.currentValue, 0);
}
