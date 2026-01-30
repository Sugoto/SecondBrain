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
 * Trigger a selection change pattern
 */
export function hapticSelection(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
}
