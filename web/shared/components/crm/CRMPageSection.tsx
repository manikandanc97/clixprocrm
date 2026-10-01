"use client";

import { cn } from "@/shared/lib/utils";

interface CRMPageSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const CRMPageSection = ({
  children,
  className,
  title,
  subtitle,
}: CRMPageSectionProps) => {
  return (
    <section className={cn("flex flex-col gap-4 sm:gap-5", className)}>
      {(title || subtitle) && (
        <div className="flex flex-col gap-1">
          {title && <h2 className="crm-section-title">{title}</h2>}
          {subtitle && <p className="crm-description">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
};











