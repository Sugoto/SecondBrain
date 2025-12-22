/**
 * View Transitions API hook for native browser transitions
 * Falls back to immediate execution if not supported
 */
import { useCallback } from 'react';

export function useViewTransition() {
  /**
   * Execute a state change with View Transition if supported
   * Uses native browser animation for smooth page transitions
   */
  const startTransition = useCallback(
    (callback: () => void | Promise<void>): Promise<void> => {
      // Check if View Transitions API is supported (Chrome 111+, Safari 18+)
      // Using type assertion since TypeScript may not have the latest types
      const doc = document as Document & {
        startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
      };
      
      if (doc.startViewTransition) {
        const transition = doc.startViewTransition(callback);
        return transition.finished;
      } else {
        // Fallback: just execute the callback
        const result = callback();
        return result instanceof Promise ? result : Promise.resolve();
      }
    },
    []
  );

  /**
   * Check if View Transitions API is available
   */
  const isSupported = typeof document !== 'undefined' && 'startViewTransition' in document;

  return { startTransition, isSupported };
}

