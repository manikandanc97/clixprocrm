"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { crmLayout } from "@/shared/lib/design-system";

export interface CRMTableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canonical data table and module card wrapper.
 * Provides unified border, card surface, elevation, rounded corners,
 * and flex column layout for CRMToolbar + CRMDataTable + CRMPagination.
 */
export const CRMTableCard = React.forwardRef<HTMLDivElement, CRMTableCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(crmLayout.tableContainer, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CRMTableCard.displayName = "CRMTableCard";

export { CRMTableCard as CRMTableContainer };
