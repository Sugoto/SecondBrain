import { useCallback, useRef, useSyncExternalStore } from "react";
import type {
  AppSection,
  HealthView,
  FinanceView,
  OmscsView,
} from "@/types/navigation";

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
  omscsView: "semester",
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

// ============ SHARED STATE STORE ============
// Module-level shared state that all hook instances subscribe to
let sharedState: NavigationState = (() => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  return parseHash(window.location.hash.slice(1)) ?? DEFAULT_STATE;
})();

const listeners = new Set<() => void>();

function getSnapshot(): NavigationState {
  return sharedState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setSharedState(updater: (prev: NavigationState) => NavigationState) {
  sharedState = updater(sharedState);
  emitChange();
}

// Initialize history state on module load
if (typeof window !== "undefined") {
  window.history.replaceState(sharedState, "", toHash(sharedState));
  
  // Handle browser back/forward navigation
  window.addEventListener("popstate", (e: PopStateEvent) => {
    const newState = (e.state as NavigationState) ?? DEFAULT_STATE;
    sharedState = newState;
    emitChange();
  });
}

/**
 * Syncs app navigation with browser history for proper back gesture support.
 * Uses a shared store so all consumers stay in sync.
 */
export function useAppNavigation() {
  // Use useSyncExternalStore to subscribe to shared state
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isHandlingPopstate = useRef(false);

  // Navigate to a section (pushes history for non-home sections)
  const navigateToSection = useCallback((section: AppSection) => {
    setSharedState((prev) => {
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
    setSharedState((prev) => {
      const next = { ...prev, healthView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  const navigateFinanceView = useCallback((financeView: FinanceView) => {
    setSharedState((prev) => {
      const next = { ...prev, financeView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  const navigateOmscsView = useCallback((omscsView: OmscsView) => {
    setSharedState((prev) => {
      const next = { ...prev, omscsView };
      if (!isHandlingPopstate.current) {
        window.history.replaceState(next, "", toHash(next));
      }
      return next;
    });
  }, []);

  const goHome = useCallback(() => {
    if (state.section === "home") return;

    const homeState = { ...DEFAULT_STATE, section: "home" as AppSection };
    window.history.replaceState(homeState, "", "#");
    setSharedState(() => homeState);
  }, [state.section]);

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
