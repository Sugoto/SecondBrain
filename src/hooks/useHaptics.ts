type HapticIntensity = "light" | "medium" | "heavy";

const VIBRATION_PATTERN: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: [30, 40, 30],
};

export function hapticFeedback(intensity: HapticIntensity = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(VIBRATION_PATTERN[intensity]);
  }
}

export function hapticSelection(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
}
