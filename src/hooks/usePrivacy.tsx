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

export function useFormatCurrency() {
  const { hidden } = usePrivacy();
  return (n: number) => (hidden ? MASK : formatCurrency(n));
}

export function useFormatCurrencyCompact() {
  const { hidden } = usePrivacy();
  return (n: number) => (hidden ? MASK : formatCurrencyCompact(n));
}

export function useMaskedRupee() {
  const { hidden } = usePrivacy();
  return (n: number, opts?: Intl.NumberFormatOptions) =>
    hidden ? MASK : `₹${n.toLocaleString("en-IN", opts)}`;
}
