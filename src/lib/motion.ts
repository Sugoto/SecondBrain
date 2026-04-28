import type { Transition } from "framer-motion";

export const m3Spring = {
  fastSpatial: { type: "spring", stiffness: 1400, damping: 38, mass: 1 } satisfies Transition,
  defaultSpatial: { type: "spring", stiffness: 700, damping: 32, mass: 1 } satisfies Transition,
  slowSpatial: { type: "spring", stiffness: 380, damping: 27, mass: 1 } satisfies Transition,
  fastEffects: { duration: 0.1, ease: [0.2, 0, 0, 1] } satisfies Transition,
  defaultEffects: { duration: 0.2, ease: [0.2, 0, 0, 1] } satisfies Transition,
  slowEffects: { duration: 0.3, ease: [0.2, 0, 0, 1] } satisfies Transition,
};
