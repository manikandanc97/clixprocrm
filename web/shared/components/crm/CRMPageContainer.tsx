"use client";

import { cn } from "@/shared/lib/utils";
import { crmLayout } from "@/shared/lib/design-system";

interface CRMPageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  fullHeight?: boolean;
  /**
   * When true, uses lightweight CSS fade-in without transforms so sticky elements work cleanly.
   */
  twoStageScroll?: boolean;
}

export const CRMPageContainer = ({
  children,
  className,
  maxWidth = "max-w-none",
  fullHeight = false,
  twoStageScroll = false,
}: CRMPageContainerProps) => {
  const isFullHeight = fullHeight || twoStageScroll;
  const baseClass = cn(
    crmLayout.pageShell,
    isFullHeight ? "flex-1 min-h-0" : "min-h-full",
    maxWidth,
    className
  );

  if (twoStageScroll) {
    return (
      <div className={cn(baseClass, "animate-in fade-in duration-300")}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(baseClass, "animate-in fade-in slide-in-from-bottom-2 duration-300")}>
      {children}
    </div>
  );
};








