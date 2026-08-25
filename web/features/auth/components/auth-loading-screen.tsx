"use client";

/**
 * AuthLoadingScreen
 *
 * Polished, minimal, and trustworthy enterprise CRM initialization screen.
 * Designed to feel like Linear, Stripe, Notion, and HubSpot.
 *
 * Features:
 * - Crisp ClixPro brand emblem and logo entrance animation
 * - Clean enterprise typography and visual hierarchy
 * - Dynamic initialization status driven by the actual auth & workspace lifecycle
 * - Ultra-thin, subtle brand accent progress indicator
 * - Timeout & error recovery state ("Something went wrong", "Try again", "Sign out")
 * - Full `prefers-reduced-motion` compliance
 * - Ultra-clean neutral enterprise background with subtle ambient radial illumination
 */

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, RotateCcw, LogOut } from "lucide-react";
import { ClixProIcon } from "@/shared/ui/logo";
import { Button } from "@/shared/ui/button";
import { useAuth, type AuthInitStage } from "./auth-provider";

interface AuthLoadingScreenProps {
  heading?: string;
  subheading?: string;
  stage?: AuthInitStage;
  error?: string | null;
  onRetry?: () => void;
  onSignOut?: () => void;
  timeoutMs?: number;
}

const STAGE_CONFIG: Record<
  AuthInitStage,
  { label: string; progress: number }
> = {
  connecting: {
    label: "Connecting securely…",
    progress: 24,
  },
  restoring: {
    label: "Restoring your workspace…",
    progress: 48,
  },
  loading_data: {
    label: "Loading your CRM data…",
    progress: 72,
  },
  preparing: {
    label: "Preparing your dashboard…",
    progress: 92,
  },
  ready: {
    label: "Almost ready…",
    progress: 100,
  },
};

export default function AuthLoadingScreen({
  heading = "Welcome back",
  subheading = "Preparing your workspace…",
  stage: propStage,
  error: propError,
  onRetry,
  onSignOut,
  timeoutMs = 12000,
}: AuthLoadingScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  // Try accessing auth context if available
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authContext = useAuth();
  } catch {
    authContext = null;
  }

  const currentStage: AuthInitStage =
    propStage || authContext?.initStage || "connecting";
  const rawError = propError !== undefined ? propError : authContext?.initError;

  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Setup safety timeout to prevent infinite stuck loading screens
  useEffect(() => {
    if (rawError) return;
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [rawError, timeoutMs]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setHasTimedOut(false);
    try {
      if (onRetry) {
        await onRetry();
      } else if (authContext?.retryInit) {
        await authContext.retryInit();
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      // Handled via context
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else if (authContext?.logout) {
      authContext.logout();
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("has_session");
      window.location.href = "/login";
    }
  };

  const isErrorState = Boolean(rawError || hasTimedOut);
  const currentConfig = STAGE_CONFIG[currentStage] || STAGE_CONFIG.connecting;

  // Animation variants optimized for enterprise calm motion
  const containerVariants: any = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: prefersReducedMotion ? 0.1 : 0.4,
          ease: "easeOut",
          staggerChildren: prefersReducedMotion ? 0 : 0.08,
        },
      },
      exit: {
        opacity: 0,
        transition: { duration: prefersReducedMotion ? 0.1 : 0.25, ease: "easeOut" },
      },
    }),
    [prefersReducedMotion]
  );

  const itemVariants: any = useMemo(
    () => ({
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: prefersReducedMotion ? 0.1 : 0.35,
          ease: "easeOut",
        },
      },
    }),
    [prefersReducedMotion]
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Workspace initialization"
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-[#08090a] select-none"
    >
      {/* Subtle enterprise ambient radial illumination */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(16,185,129,0.04),transparent_80%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(16,185,129,0.06),transparent_80%)]"
        aria-hidden="true"
      />

      {/* Main Content Container */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center px-6 py-8 text-center"
      >
        <AnimatePresence mode="wait">
          {!isErrorState ? (
            /* Active Initialization State */
            <motion.div
              key="loading-content"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full flex-col items-center"
            >
              {/* 1. ClixPro Brand Emblem */}
              <motion.div
                variants={itemVariants}
                className="relative mb-6 flex items-center justify-center"
              >
                <div className="relative flex items-center justify-center p-2 rounded-2xl bg-background/80 dark:bg-card/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] border border-border/60">
                  <ClixProIcon size="lg" pixelSize={38} className="transition-transform" />
                </div>
              </motion.div>

              {/* 2. Welcome Back Heading */}
              <motion.h1
                variants={itemVariants}
                className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
              >
                {heading}
              </motion.h1>

              {/* 3. Short Supporting Text */}
              <motion.p
                variants={itemVariants}
                className="mt-1 text-sm font-normal text-muted-foreground"
              >
                {subheading}
              </motion.p>

              {/* 4. Minimal Animated Progress Indicator */}
              <motion.div
                variants={itemVariants}
                className="mt-6 w-52 sm:w-56"
              >
                <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-muted/90 dark:bg-muted/50">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/90"
                    initial={{ width: "15%" }}
                    animate={{
                      width: `${currentConfig.progress}%`,
                    }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.1 }
                        : {
                            duration: 0.5,
                            ease: "easeInOut",
                          }
                    }
                  />
                </div>
              </motion.div>

              {/* 5. Dynamic Initialization Status */}
              <motion.div
                variants={itemVariants}
                className="mt-3.5 h-5 flex items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentStage}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 3 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -3 }
                    }
                    transition={{ duration: 0.2 }}
                    className="text-xs font-medium text-muted-foreground/80 tracking-normal"
                  >
                    {currentConfig.label}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            /* Error / Timeout Recovery State */
            <motion.div
              key="error-recovery"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full flex-col items-center rounded-2xl bg-card/70 dark:bg-card/40 p-6 shadow-sm border border-border/80"
            >
              {/* Error Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-5 w-5" />
              </div>

              {/* Error Heading */}
              <h2 className="text-base font-semibold text-foreground">
                Something went wrong
              </h2>

              {/* Error Description */}
              <p className="mt-1.5 text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                We couldn&apos;t prepare your workspace. Please check your connection and try again.
              </p>

              {/* Recovery Actions */}
              <div className="mt-6 flex w-full flex-col gap-2">
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "Retrying…" : "Try again"}
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Subtle brand attribution at bottom for high-trust enterprise feel */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center pointer-events-none opacity-40">
        <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
          ClixPro Enterprise CRM
        </span>
      </div>
    </div>
  );
}

