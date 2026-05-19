import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatCurrency, formatCurrencyCompact } from "@/components/finances/constants";

const STORAGE_KEY = "privacy-hidden";
const MASK = "₹•••";

interface PrivacyContextValue {
  hidden: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  hidden: false,
  toggle: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(hidden));
  }, [hidden]);

  return (
    <PrivacyContext.Provider value={{ hidden, toggle: () => setHidden((h) => !h) }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

/**
 * General-purpose currency formatter. Always returns the formatted value —
 * privacy mode does NOT mask transactions, budgets, or analysis tools.
 */
export function useFormatCurrency() {
  return (n: number) => formatCurrency(n);
}

export function useFormatCurrencyCompact() {
  return (n: number) => formatCurrencyCompact(n);
}

export function useMaskedRupee() {
  return (n: number, opts?: Intl.NumberFormatOptions) =>
    `₹${n.toLocaleString("en-IN", opts)}`;
}

/**
 * Asset-aware formatters. These mask their value when privacy mode is on.
 * Use ONLY for net worth, assets, salary, and other holdings-level numbers.
 */
export function useAssetCurrency() {
  const { hidden } = usePrivacy();
  return (n: number) => (hidden ? MASK : formatCurrency(n));
}

export function useAssetCurrencyCompact() {
  const { hidden } = usePrivacy();
  return (n: number) => (hidden ? MASK : formatCurrencyCompact(n));
}

export function useMaskedAssetRupee() {
  const { hidden } = usePrivacy();
  return (n: number, opts?: Intl.NumberFormatOptions) =>
    hidden ? MASK : `₹${n.toLocaleString("en-IN", opts)}`;
}
