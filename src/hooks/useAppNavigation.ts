import { useState, useEffect, useCallback, useRef } from "react";
import type { AppSection, HealthView, FinanceView, OmscsView } from "@/types/navigation";

interface NavigationState {
  section: AppSection;
  healthView: HealthView;
  financeView: FinanceView;
  omscsView: OmscsView;
}

const DEFAULT_STATE: NavigationState = {
  section: "home",
  healthView: "nutrition",
  financeView: "expenses",
  omscsView: "grades",
};

// Parse hash into navigation state
function parseHash(hash: string): NavigationState | null {
  if (!hash) return null;

  const parts = hash.split("/");
  const section = parts[0] as AppSection;

  if (!["home", "omscs", "finances", "fitness"].includes(section)) {
    return null;
  }

  return {
    section,
    healthView:
      section === "fitness" && parts[1]
        ? (parts[1] as HealthView)
        : DEFAULT_STATE.healthView,
    financeView:
      section === "finances" && parts[1]
        ? (parts[1] as FinanceView)
        : DEFAULT_STATE.financeView,
    omscsView:
      section === "omscs" && parts[1]
        ? (parts[1] as OmscsView)
        : DEFAULT_STATE.omscsView,
  };
}

// Generate hash from navigation state
function toHash(state: NavigationState): string {
  if (state.section === "home") return "#";
  if (state.section === "finances") return `#finances/${state.financeView}`;
  if (state.section === "fitness") return `#fitness/${state.healthView}`;
  if (state.section === "omscs") return `#omscs/${state.omscsView}`;
  return `#${state.section}`;
}

// Cache initial state to avoid re-parsing
const INITIAL_STATE: NavigationState = (() => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  return parseHash(window.location.hash.slice(1)) ?? DEFAULT_STATE;
})();

/**
 * Syncs app navigation with browser history for proper back gesture support.
 */
export function useAppNavigation() {
  // Single state object - fewer re-renders than separate useState calls
  const [state, setState] = useState<NavigationState>(INITIAL_STATE);
  const isHandlingPopstate = useRef(false);

  // Initialize history state on mount
  useEffect(() => {
    window.history.replaceState(state, "", toHash(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopstate = (e: PopStateEvent) => {
      isHandlingPopstate.current = true;
      setState((e.state as NavigationState) ?? DEFAULT_STATE);
      requestAnimationFrame(() => {
        isHandlingPopstate.current = false;
      });
    };

    window.addEventListener("popstate", onPopstate);
    return () => window.removeEventListener("popstate", onPopstate);
  }, []);

  // Navigate to a section (pushes history for non-home sections)
  const navigateToSection = useCallback((section: AppSection) => {
    setState((prev) => {
      const next = { ...prev, section };

      if (!isHandlingPopstate.current) {
        if (section !== "home") {
          window.history.pushState(next, "", toHash(next));
        } else {
          window.history.replaceState(next, "", toHash(next));
        }
      }

      return next;
    });
  }, []);

  // Update sub-view within a section (replaces history, doesn't add entry)
  const navigateHealthView = useCallback((healthView: HealthView) => {
    setState((prev) => {
      const next = { ...prev, healthView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  const navigateFinanceView = useCallback((financeView: FinanceView) => {
    setState((prev) => {
      const next = { ...prev, financeView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  const navigateOmscsView = useCallback((omscsView: OmscsView) => {
    setState((prev) => {
      const next = { ...prev, omscsView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  // Go home - uses history.back() for native feel when possible
  const goHome = useCallback(() => {
    if (state.section === "home") return;

    // If we came from home, use native back for smoother animation
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateToSection("home");
    }
  }, [state.section, navigateToSection]);

  return {
    currentSection: state.section,
    healthView: state.healthView,
    financeView: state.financeView,
    omscsView: state.omscsView,
    navigateToSection,
    navigateHealthView,
    navigateFinanceView,
    navigateOmscsView,
    goHome,
  };
}
