/**
 * Haptic feedback utility for native-feeling touch interactions
 */

type HapticIntensity = "light" | "medium" | "heavy";

const VIBRATION_DURATION: Record<HapticIntensity, number> = {
  light: 30,
  medium: 30,
  heavy: 30,
};

/**
 * Trigger haptic feedback if supported
 */
export function hapticFeedback(intensity: HapticIntensity = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(VIBRATION_DURATION[intensity]);
  }
}

/**
 * Trigger a success pattern (two short pulses)
 */
export function hapticSuccess(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}

/**
 * Trigger an error pattern (one long pulse)
 */
export function hapticError(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50);
  }
}

/**
 * Trigger a selection change pattern
 */
export function hapticSelection(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}
