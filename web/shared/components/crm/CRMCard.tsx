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
  /**
   * If true, renders a 4px left accent border using `border-l-primary`.
   * Always uses the semantic primary token — never hardcoded color families.
   */
  withAccent?: boolean;
  /**
   * @deprecated Ignored. Accent borders now always use `border-l-primary` (semantic token).
   * Previously passed a hardcoded color class; removed to comply with design system rules.
   */
  accentColor?: string;
  /**
   * @deprecated Ignored. Accent borders now always use `border-l-primary` (semantic token).
   * Previously computed a color from a seed hash; removed to comply with design system rules.
   */
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
}: CRMCardProps) => {
  return (
    <div
      onClick={onClick}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
      className={cn(
        "overflow-hidden",
        crmSurface.card,
        hoverable && crmSurface.interactive,
        !noPadding && "p-4 sm:p-5",
        withAccent && "border-l-4 border-l-primary",
        animate && "animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
        className,
        "rounded-xl"
      )}
    >
      {children}
    </div>
  );
};
