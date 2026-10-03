import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Snack = { id: number; message: string; onUndo: () => unknown };

const DURATION_MS = 5000;

let current: Snack | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: Snack | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function showUndo(message: string, onUndo: Snack["onUndo"]) {
  emit({ id: nextId++, message, onUndo });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const useCurrentSnack = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

export const useSnackVisible = () => useCurrentSnack() !== null;

export function Snackbar() {
  const snack = useCurrentSnack();

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => {
      if (current?.id === snack.id) emit(null);
    }, DURATION_MS);
    return () => clearTimeout(timer);
  }, [snack]);

  return createPortal(
    <div
      aria-live="polite"
      className="no-view-transition pointer-events-none fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      {snack && (
        <div
          key={snack.id}
          role="status"
          className="ui-plate ui-type ui-snack pointer-events-auto flex h-12 w-full max-w-md items-center justify-between gap-3 rounded-[14px] pr-1.5 pl-4 shadow-[0_10px_30px_-12px_oklch(20%_0.04_275/0.45)]"
        >
          <span className="truncate text-[14px] text-[var(--ui-plate-ink)]">{snack.message}</span>
          <button
            type="button"
            onClick={() => {
              emit(null);
              void Promise.resolve(snack.onUndo()).catch(console.error);
            }}
            className="h-9 shrink-0 rounded-[10px] px-3 text-[14px] font-semibold text-[var(--ui-accent-plate)] transition-colors hover:bg-[var(--ui-plate-edge)] focus-visible:outline-2 focus-visible:outline-[var(--ui-plate-ink)]"
          >
            Undo
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
