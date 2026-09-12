"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

// ClixProCRM curated celebration colors
const CELEBRATION_COLORS = [
  "#10B981", // Green (Emerald 500)
  "#059669", // Emerald 600
  "#34D399", // Mint / Light Emerald
  "#06B6D4", // Cyan 500
  "#3B82F6", // Blue 500
  "#8B5CF6", // Purple 500
  "#FBBF24", // Yellow / Gold
  "#F97316", // Orange 500
  "#EC4899", // Pink 500
];

export function DashboardCelebration() {
  const shouldReduceMotion = useReducedMotion();
  const [isActivating, setIsActivating] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const hasTriggeredRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Check the one-time real workspace activation trigger
  useEffect(() => {
    if (typeof window === "undefined" || hasTriggeredRef.current) return;

    const isActivationPending =
      sessionStorage.getItem("workspace_activation_celebration_pending") === "1" ||
      sessionStorage.getItem("celebrate_new_account") === "1";

    if (!isActivationPending) return;

    hasTriggeredRef.current = true;

    // 1. Immediately consume and remove the flag so it never fires again on refresh/nav/login
    sessionStorage.removeItem("workspace_activation_celebration_pending");
    sessionStorage.removeItem("celebrate_new_account");

    // 2. Clean URL query parameters silently if present
    if (window.location.search.includes("celebrate")) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // 3. Mount activation overlay and display floating banner
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsActivating(true);
    const tBanner = setTimeout(() => {
      setShowSuccessBanner(true);
    }, 150);
    timeoutsRef.current.push(tBanner);

    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Execute multi-origin confetti explosion once the canvas is mounted
  useEffect(() => {
    if (!isActivating || shouldReduceMotion) {
      if (isActivating && shouldReduceMotion) {
        // If reduced motion is preferred, hide banner after 2.5s and unmount
        const tHide = setTimeout(() => setShowSuccessBanner(false), 2500);
        const tUnmount = setTimeout(() => setIsActivating(false), 3000);
        timeoutsRef.current.push(tHide, tUnmount);
      }
      return;
    }

    const canvas = canvasRef.current;
    const fireInstance = canvas
      ? confetti.create(canvas, { resize: true, useWorker: true })
      : confetti;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const multiplier = isMobile ? 0.65 : 1.0;

    const fire = (opts: confetti.Options) => {
      try {
        fireInstance(opts);
      } catch {
        try {
          confetti(opts);
        } catch {}
      }
    };

    // -------------------------------------------------------------
    // Phase 1 (T = 100ms): Precursor top sparkle flurry
    // -------------------------------------------------------------
    const t1 = setTimeout(() => {
      fire({
        particleCount: Math.floor(35 * multiplier),
        spread: 90,
        startVelocity: 26,
        origin: { x: 0.5, y: 0.15 },
        colors: ["#34D399", "#FBBF24", "#06B6D4", "#EC4899"],
        ticks: 180,
        gravity: 0.8,
        scalar: 0.9,
        shapes: ["circle"],
        disableForReducedMotion: true,
      });
    }, 100);

    // -------------------------------------------------------------
    // Phase 2 (T = 300ms): MAIN 5-ORIGIN CANNON BURST
    // -------------------------------------------------------------
    const t2 = setTimeout(() => {
      // 1. Central Hero Burst
      fire({
        particleCount: Math.floor(90 * multiplier),
        spread: 140,
        startVelocity: 46,
        origin: { x: 0.5, y: 0.35 },
        colors: CELEBRATION_COLORS,
        ticks: 260,
        gravity: 0.95,
        scalar: 1.1,
        shapes: ["square", "circle"],
        disableForReducedMotion: true,
      });

      // 2. Upper-Left Canopy
      fire({
        particleCount: Math.floor(55 * multiplier),
        angle: 310,
        spread: 80,
        startVelocity: 40,
        origin: { x: 0.12, y: 0.18 },
        colors: CELEBRATION_COLORS,
        ticks: 240,
        gravity: 0.9,
        scalar: 0.95,
        shapes: ["square", "circle"],
        disableForReducedMotion: true,
      });

      // 3. Upper-Right Canopy
      fire({
        particleCount: Math.floor(55 * multiplier),
        angle: 230,
        spread: 80,
        startVelocity: 40,
        origin: { x: 0.88, y: 0.18 },
        colors: CELEBRATION_COLORS,
        ticks: 240,
        gravity: 0.9,
        scalar: 0.95,
        shapes: ["square", "circle"],
        disableForReducedMotion: true,
      });

      // 4. Lateral Left Inward Cannon
      fire({
        particleCount: Math.floor(45 * multiplier),
        angle: 55,
        spread: 60,
        startVelocity: 52,
        origin: { x: 0.03, y: 0.55 },
        colors: CELEBRATION_COLORS,
        ticks: 260,
        gravity: 1.02,
        scalar: 1.0,
        shapes: ["square"],
        disableForReducedMotion: true,
      });

      // 5. Lateral Right Inward Cannon
      fire({
        particleCount: Math.floor(45 * multiplier),
        angle: 125,
        spread: 60,
        startVelocity: 52,
        origin: { x: 0.97, y: 0.55 },
        colors: CELEBRATION_COLORS,
        ticks: 260,
        gravity: 1.02,
        scalar: 1.0,
        shapes: ["square"],
        disableForReducedMotion: true,
      });
    }, 300);

    // -------------------------------------------------------------
    // Phase 3 (T = 800ms): Secondary Cascading Rains
    // -------------------------------------------------------------
    const t3 = setTimeout(() => {
      fire({
        particleCount: Math.floor(40 * multiplier),
        spread: 85,
        startVelocity: 28,
        origin: { x: 0.3, y: 0.25 },
        colors: ["#10B981", "#3B82F6", "#FBBF24", "#EC4899"],
        ticks: 210,
        gravity: 0.85,
        scalar: 0.9,
        shapes: ["circle", "square"],
        disableForReducedMotion: true,
      });

      fire({
        particleCount: Math.floor(40 * multiplier),
        spread: 85,
        startVelocity: 28,
        origin: { x: 0.7, y: 0.25 },
        colors: ["#059669", "#8B5CF6", "#F97316", "#06B6D4"],
        ticks: 210,
        gravity: 0.85,
        scalar: 0.9,
        shapes: ["circle", "square"],
        disableForReducedMotion: true,
      });
    }, 800);

    // -------------------------------------------------------------
    // Phase 4 (T = 1400ms): Finale micro-sparkle flurry
    // -------------------------------------------------------------
    const t4 = setTimeout(() => {
      fire({
        particleCount: Math.floor(35 * multiplier),
        spread: 120,
        startVelocity: 24,
        origin: { x: 0.5, y: 0.2 },
        colors: ["#34D399", "#FBBF24", "#06B6D4", "#EC4899"],
        ticks: 190,
        gravity: 0.75,
        scalar: 0.85,
        shapes: ["circle"],
        disableForReducedMotion: true,
      });
    }, 1400);

    // Fade out floating banner at T = 2800ms
    const tHideBanner = setTimeout(() => {
      setShowSuccessBanner(false);
    }, 2800);

    // Completely unmount celebration overlay after particles dissolve (T = 4000ms)
    const tComplete = setTimeout(() => {
      setIsActivating(false);
    }, 4000);

    timeoutsRef.current.push(t1, t2, t3, t4, tHideBanner, tComplete);

    return () => {
      clearAllTimers();
    };
  }, [isActivating, shouldReduceMotion, clearAllTimers]);

  if (!isActivating) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Full-Screen Confetti Canvas Overlay (guaranteed top layer z-[9999]) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Subtle Ambient Radial Glow (Fades out quickly) */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.9, 1.1, 1.15] }}
          transition={{ duration: 2.4, ease: "easeOut" }}
          className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-indigo-500/20 blur-[110px] rounded-full"
        />
      )}

      {/* Floating "Workspace Activated!" Banner */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0, y: -10 }
                : { opacity: 0, y: -24, scale: 0.94 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -16, scale: 0.96 }
            }
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 26,
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center justify-center px-4 w-full max-w-md pointer-events-none"
          >
            <div className="relative overflow-hidden rounded-2xl bg-card/95 dark:bg-card/90 backdrop-blur-2xl border border-emerald-500/40 p-4 shadow-2xl shadow-emerald-950/30 text-foreground flex items-center gap-3.5 w-full">
              {/* Top Accent Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              {/* Glowing Icon Badge */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/35 border border-emerald-300/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold tracking-tight text-foreground truncate">
                    Workspace Activated!
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                  Welcome to ClixProCRM. Your CRM workspace is ready.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DashboardCelebration;
