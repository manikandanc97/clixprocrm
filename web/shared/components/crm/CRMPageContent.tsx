"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

export interface CRMPageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, applies the enterprise two-stage sticky scroll container styling.
   */
  twoStage?: boolean;
}

/**
 * Standardized page content wrapper that enforces vertical flow rhythm (gap-4 sm:gap-5)
 * and correct flex containment between CRMPageHeader and page modules.
 */
export const CRMPageContent = React.forwardRef<HTMLDivElement, CRMPageContentProps>(
  ({ children, className, twoStage = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col flex-1 min-h-0 w-full gap-4 sm:gap-5",
          twoStage && "crm-table-workspace",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CRMPageContent.displayName = "CRMPageContent";

export { CRMPageContent as PageContent };
