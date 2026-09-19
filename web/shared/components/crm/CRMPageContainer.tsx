"use client";

import { cn } from "@/shared/lib/utils";

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
    "mx-auto w-full flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 pt-1 pb-24 md:pb-3.5 relative",
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








