import { startTransition, useCallback, useEffect, useState } from "react";
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
  omscsView: "semester",
};

function parseHash(hash: string): NavigationState | null {
  if (!hash) return null;

  const parts = hash.split("/");
  const section = parts[0] as AppSection;

  if (!["home", "omscs", "finances", "fitness", "profile"].includes(section)) {
    return null;
  }

  return {
    section,
    healthView:
      section === "fitness" && parts[1] ? (parts[1] as HealthView) : DEFAULT_STATE.healthView,
    financeView:
      section === "finances" && parts[1] ? (parts[1] as FinanceView) : DEFAULT_STATE.financeView,
    omscsView: section === "omscs" && parts[1] ? (parts[1] as OmscsView) : DEFAULT_STATE.omscsView,
  };
}

function toHash(state: NavigationState): string {
  if (state.section === "home") return "#";
  if (state.section === "finances") return `#finances/${state.financeView}`;
  if (state.section === "fitness") return `#fitness/${state.healthView}`;
  if (state.section === "omscs") return `#omscs/${state.omscsView}`;
  return `#${state.section}`;
}

function readState(): NavigationState {
  const saved = navigation.currentEntry?.getState() as NavigationState | undefined;
  return saved ?? parseHash(window.location.hash.slice(1)) ?? DEFAULT_STATE;
}

function commit(next: NavigationState, history: NavigationHistoryBehavior) {
  navigation.navigate(toHash(next), { state: next, history }).finished?.catch(() => {});
}

export function useAppNavigation() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    const sync = () => startTransition(() => setState(readState()));
    navigation.addEventListener("currententrychange", sync);
    return () => navigation.removeEventListener("currententrychange", sync);
  }, []);

  const navigateToSection = useCallback((section: AppSection) => {
    commit({ ...readState(), section }, section === "home" ? "replace" : "push");
  }, []);

  const navigateHealthView = useCallback((healthView: HealthView) => {
    commit({ ...readState(), healthView }, "replace");
  }, []);

  const navigateFinanceView = useCallback((financeView: FinanceView) => {
    commit({ ...readState(), financeView }, "replace");
  }, []);

  const navigateOmscsView = useCallback((omscsView: OmscsView) => {
    commit({ ...readState(), omscsView }, "replace");
  }, []);

  const goHome = useCallback(() => {
    if (readState().section === "home") return;
    commit(DEFAULT_STATE, "replace");
  }, []);

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
