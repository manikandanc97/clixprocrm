"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  Loader2,
  AlertCircle,
  RotateCw,
  Building2,
  Layers,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

export type SetupStepId = 0 | 1 | 2 | 3 | 4;

export interface AccountCreationCelebrationProps {
  open: boolean;
  activeStep: SetupStepId;
  completedSteps: number[];
  errorMessage?: string | null;
  status: "idle" | "in_progress" | "ready" | "error";
  companyName?: string;
  onRetry?: () => void;
  className?: string;
}

interface StepDefinition {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const SETUP_STEPS: StepDefinition[] = [
  {
    id: 0,
    label: "Creating workspace",
    sublabel: "Initializing database tenancy and isolated security boundaries",
    icon: Building2,
  },
  {
    id: 1,
    label: "Preparing your CRM",
    sublabel: "Configuring default pipelines, role templates, and permissions",
    icon: Layers,
  },
  {
    id: 2,
    label: "Setting up your dashboard",
    sublabel: "Customizing analytics widgets, KPIs, and quick actions",
    icon: LayoutDashboard,
  },
  {
    id: 3,
    label: "Finalizing your account",
    sublabel: "Securing session tokens and preparing live CRM environment",
    icon: ShieldCheck,
  },
];

export function AccountCreationCelebration({
  open,
  activeStep,
  completedSteps,
  errorMessage,
  status,
  companyName,
  onRetry,
  className = "",
}: AccountCreationCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!open) return null;

  // Real progress derived strictly from completed operations
  const progressPercent =
    status === "error"
      ? 100
      : Math.min(100, Math.round((completedSteps.length / SETUP_STEPS.length) * 100));

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Setting up your workspace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.15 : 0.25, ease: "easeInOut" }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-background ${className}`}
      >
        {/* Ambient Gradient Mesh Background */}
        <div className="absolute inset-0 gradient-mesh opacity-80 pointer-events-none" />

        {/* Floating Ambient Glow Orbs */}
        {!shouldReduceMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-indigo-500/15 blur-[100px] rounded-full"
            />
          </div>
        )}

        {/* Content Container */}
        <div className="relative z-20 flex flex-col items-center justify-center max-w-md w-full text-center px-4">
          {/* Top Status Icon */}
          <div className="relative flex items-center justify-center mb-6">
            {!shouldReduceMotion && status !== "error" && (
              <motion.div
                animate={{
                  scale: [1, 1.18, 1],
                  opacity: [0.25, 0.5, 0.25],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-24 h-24 bg-emerald-500/25 rounded-full blur-xl"
              />
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`relative flex items-center justify-center w-16 h-16 rounded-2xl text-white font-black text-2xl shadow-xl transition-colors duration-300 ${
                status === "error"
                  ? "bg-gradient-to-br from-red-500 to-rose-700 shadow-rose-900/25 border border-rose-400/40"
                  : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-emerald-950/25 border border-emerald-400/30"
              }`}
            >
              {status === "error" ? (
                <AlertCircle className="w-8 h-8 text-white" />
              ) : (
                <Sparkles className="w-8 h-8 text-white" />
              )}
            </motion.div>
          </div>

          {/* Heading */}
          <div className="space-y-1.5 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {status === "error" ? "Setup Encountered an Issue" : "Setting up your workspace"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {status === "error"
                ? errorMessage || "Unable to create your workspace. Please try again."
                : companyName
                ? `Preparing ClixProCRM for ${companyName}...`
                : "Getting everything ready for your team..."}
            </p>
          </div>

          {/* Error State Retry */}
          {status === "error" ? (
            <div className="w-full max-w-xs mt-2">
              <Button
                type="button"
                onClick={onRetry}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            </div>
          ) : (
            /* Setup Steps Checkpoints (Reflects REAL Operations) */
            <div className="w-full bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 text-left">
              {SETUP_STEPS.map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                const isActive = activeStep === step.id && !isCompleted;

                return (
                  <motion.div
                    key={step.id}
                    layout
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25"
                        : isCompleted
                        ? "bg-muted/40 border border-transparent"
                        : "opacity-45 border border-transparent"
                    }`}
                  >
                    {/* Status Circle / Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                          : isActive
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <step.icon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold tracking-tight transition-colors ${
                          isCompleted
                            ? "text-foreground"
                            : isActive
                            ? "text-emerald-700 dark:text-emerald-300 font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {/* Step State Badge */}
                    <div className="shrink-0 text-[11px] font-semibold">
                      {isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Ready</span>
                      ) : isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">
                          In progress...
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Pending</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Progress Bar (Strictly represents completed real steps) */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-1.5 px-0.5">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AccountCreationCelebration;
