/**
 * ClixProCRM Enterprise Motion System Tokens
 * Standardized timing, easing curves, and physics configurations
 * inspired by Linear, Stripe, Notion, and Vercel.
 */

export const MOTION_DURATIONS = {
  instant: 0.1, // 100ms - press/tap feedback, instant toggles
  fast: 0.18,   // 180ms - hover micro-states
  normal: 0.24, // 240ms - active indicator gliding, tab transitions
  slow: 0.32,   // 320ms - collapsible menus, drawer slides
  // Icon micro-interactions (500ms–580ms smooth, natural SaaS timings)
  iconFast: 0.48,
  iconNormal: 0.54,
  iconComplex: 0.58,
} as const;

export const MOTION_EASINGS = {
  // Swift quintic ease-out for ultra-responsive navigation feedback
  easeOut: [0.16, 1, 0.3, 1] as const,
  // Natural cubic-bezier for smooth icon micro-movements (deliberate deceleration, no flash)
  iconEase: [0.16, 1, 0.3, 1] as const,
  // Standard smooth easeInOut for state transitions
  easeInOut: [0.4, 0, 0.2, 1] as const,
  // Physical spring for shared gliders (smooth, controlled, non-bouncy)
  springGlider: {
    type: "spring" as const,
    stiffness: 420,
    damping: 38,
    mass: 0.8,
  },
  // Subtler spring for micro-interactions
  springSubtle: {
    type: "spring" as const,
    stiffness: 450,
    damping: 38,
    mass: 0.7,
  },
} as const;

/**
 * Common variants for enterprise micro-interactions
 */
export const MOTION_VARIANTS = {
  // Tactile click press
  pressable: {
    whileTap: { scale: 0.98, transition: { duration: MOTION_DURATIONS.instant } },
  },
  // Subtle content fade & lift
  contentFadeIn: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut },
  },
  // Collapsible dropdown / nested group
  collapse: {
    initial: { opacity: 0, height: 0, overflow: "hidden" as const },
    animate: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: MOTION_DURATIONS.slow, ease: MOTION_EASINGS.easeOut },
        opacity: { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut },
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut },
        opacity: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.easeOut },
      },
    },
  },
} as const;
