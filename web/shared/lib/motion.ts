/**
 * ClixProCRM Enterprise Motion System
 * 
 * Centralized motion tokens, easing functions, animation variants,
 * and interaction transitions. Designed for enterprise SaaS:
 * fast, predictable, restrained, and calm.
 */

import { type Transition, type Variants } from "framer-motion";

// ============================================================================
// 1. MOTION TOKENS (Durations, Easings, Scales)
// ============================================================================

export const motionTokens = {
  duration: {
    micro: 0.1,      // 100ms: Press, instant feedback
    fast: 0.15,      // 150ms: Dropdowns, tooltips, buttons
    normal: 0.2,     // 200ms: Modals, tabs, popovers
    panel: 0.25,     // 250ms: Drawers, side sheets
    page: 0.2,       // 200ms: Route/page entrance
  },
  easing: {
    // Smooth, decelerating cubic-bezier for natural UI transitions
    easeOut: [0.16, 1, 0.3, 1] as const,
    // Symmetric ease for enter/exit
    easeInOut: [0.4, 0, 0.2, 1] as const,
    // Snappy entrance
    snappy: [0.2, 0, 0, 1] as const,
  },
  spring: {
    // Restrained spring with NO bounce/overshoot for enterprise stability
    subtle: {
      type: "spring",
      stiffness: 420,
      damping: 32,
      mass: 0.8,
    } as Transition,
    // Tab & indicator movement
    indicator: {
      type: "spring",
      stiffness: 450,
      damping: 36,
      mass: 0.8,
    } as Transition,
  },
  scale: {
    buttonHover: 1.01,
    buttonTap: 0.98,
    iconHover: 1.05,
    iconTap: 0.94,
    cardHover: 1.002,
    subtleHover: 1.005,
    subtleTap: 0.985,
  },
} as const;

// ============================================================================
// 2. STANDARD TRANSITIONS
// ============================================================================

export const transitions = {
  micro: {
    duration: motionTokens.duration.micro,
    ease: motionTokens.easing.easeOut,
  },
  fast: {
    duration: motionTokens.duration.fast,
    ease: motionTokens.easing.easeOut,
  },
  normal: {
    duration: motionTokens.duration.normal,
    ease: motionTokens.easing.easeOut,
  },
  panel: {
    duration: motionTokens.duration.panel,
    ease: motionTokens.easing.easeInOut,
  },
  page: {
    duration: motionTokens.duration.page,
    ease: motionTokens.easing.easeOut,
  },
};

// ============================================================================
// 3. REUSABLE ANIMATION VARIANTS
// ============================================================================

/**
 * Dropdown & Select popovers: fast opacity + small 4px vertical shift
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -4,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.99,
    transition: transitions.micro,
  },
};

/**
 * Dialogs & Modals: clean opacity + subtle scale (0.98 -> 1)
 */
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: transitions.fast,
  },
};

/**
 * Modal Backdrop Overlay
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

/**
 * Side Drawers (Right & Left)
 */
export const drawerRightVariants: Variants = {
  initial: {
    x: "100%",
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: transitions.panel,
  },
  exit: {
    x: "100%",
    opacity: 0.8,
    transition: transitions.panel,
  },
};

export const drawerLeftVariants: Variants = {
  initial: {
    x: "-100%",
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: transitions.panel,
  },
  exit: {
    x: "-100%",
    opacity: 0.8,
    transition: transitions.panel,
  },
};

/**
 * Tab Content Transition: subtle fade + small vertical translate (y: 4px -> 0)
 */
export const tabContentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: transitions.micro,
  },
};

/**
 * Form Validation / Action Failure Shake (restrained, 3px max)
 */
export const shakeErrorVariants: Variants = {
  shake: {
    x: [-3, 3, -2, 2, 0],
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};

/**
 * Success Badge / Checkmark entrance
 */
export const successPopVariants: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: transitions.fast,
  },
};

/**
 * Button Micro-Interactions
 */
export const buttonPressProps = {
  whileHover: { scale: motionTokens.scale.buttonHover },
  whileTap: { scale: motionTokens.scale.buttonTap },
  transition: transitions.micro,
};

export const iconPressProps = {
  whileHover: { scale: motionTokens.scale.iconHover },
  whileTap: { scale: motionTokens.scale.iconTap },
  transition: transitions.micro,
};

// Backwards compatibility aliases
export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  snappy: [0.2, 0, 0, 1] as const,
  springGlider: {
    type: "spring",
    stiffness: 450,
    damping: 36,
    mass: 0.8,
  } as Transition,
};

export const MOTION_DURATIONS = motionTokens.duration;
