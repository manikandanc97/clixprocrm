"use client";

import { cn } from "@/shared/lib/utils";
import { crmSurface } from "@/shared/lib/design-system";
import { ReactNode } from "react";

interface CRMCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  noPadding?: boolean;
  animate?: boolean;
  delay?: number;
  withAccent?: boolean;
  accentColor?: string;
  accentSeed?: string | number;
}

export const CRMCard = ({
  children,
  className,
  onClick,
  hoverable = true,
  noPadding = false,
  animate = true,
  delay = 0,
  withAccent = false,
  accentColor,
  accentSeed,
}: CRMCardProps) => {
  const accentColors = [
    "border-l-blue-500",
    "border-l-emerald-500",
    "border-l-violet-500",
    "border-l-amber-500",
    "border-l-rose-500",
    "border-l-cyan-500",
    "border-l-indigo-500",
    "border-l-purple-500",
    "border-l-pink-500",
    "border-l-orange-500",
  ];

  const getStableColor = (seed: string | number) => {
    const s = String(seed);
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return accentColors[Math.abs(hash) % accentColors.length];
  };

  const finalAccentColor = accentColor || (accentSeed !== undefined ? getStableColor(accentSeed) : "border-l-primary");

  return (
    <div
      onClick={onClick}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
      className={cn(
        "overflow-hidden",
        crmSurface.card,
        hoverable && crmSurface.interactive,
        !noPadding && "p-4 sm:p-5",
        withAccent && "border-l-4",
        withAccent && finalAccentColor,
        animate && "animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
        className,
        "rounded-xl"
      )}
    >
      {children}
    </div>
  );
};











