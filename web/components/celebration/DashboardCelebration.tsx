"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Options as ConfettiOptions } from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";



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

    let isCancelled = false;

    const runConfettiCelebration = async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (isCancelled) return;

      const canvas = canvasRef.current;
      const fireInstance = canvas
        ? confetti.create(canvas, { resize: true, useWorker: true })
        : confetti;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const multiplier = isMobile ? 0.65 : 1.0;

      const fire = (opts: ConfettiOptions) => {
        if (isCancelled) return;
        try {
          fireInstance(opts);
        } catch {
          try {
            confetti(opts);
          } catch {}
        }
      };

    // -------------------------------------------------------------
    // Premium SaaS Subtle Sparkler Burst (T = 150ms)
    // -------------------------------------------------------------
    const t1 = setTimeout(() => {
      // Small, soft glow particles simulating a quick burst of stars/sparkles
      fire({
        particleCount: Math.floor(40 * multiplier),
        spread: 70,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.15 }, // Near the floating banner
        colors: ["#34D399", "#FBBF24", "#06B6D4", "#EC4899", "#10B981"],
        ticks: 120, // Short-lived (approx 1.5s - 2s depending on frame rate)
        gravity: 0.6, // Soft floating effect
        scalar: 0.8, // Small particles
        shapes: ["circle", "square"],
        disableForReducedMotion: true,
      });

      // Secondary even smaller overlay for "sparkle" effect
      fire({
        particleCount: Math.floor(25 * multiplier),
        spread: 90,
        startVelocity: 22,
        origin: { x: 0.5, y: 0.15 },
        colors: ["#FDE68A", "#FFFFFF"], // Bright center sparks
        ticks: 100, // Even shorter
        gravity: 0.4,
        scalar: 0.5,
        shapes: ["circle"],
        disableForReducedMotion: true,
      });
    }, 150);

    // Fade out floating banner at T = 2000ms (keeps the interaction fast & non-intrusive)
    const tHideBanner = setTimeout(() => {
      setShowSuccessBanner(false);
    }, 2000);

    // Completely unmount celebration overlay after particles dissolve (T = 2500ms)
    const tComplete = setTimeout(() => {
      setIsActivating(false);
    }, 2500);

    timeoutsRef.current.push(t1, tHideBanner, tComplete);
    };

    runConfettiCelebration();

    return () => {
      isCancelled = true;
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
