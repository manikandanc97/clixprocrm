"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface Action {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "premium" | "emerald";
}

interface CRMPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  actions?: Action[];
  className?: string;
}

export const CRMPageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  badge,
  actions,
  className,
}: CRMPageHeaderProps) => {
  return (
    <div className={cn("flex flex-col justify-between gap-4 md:flex-row md:items-end", className)}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn("crm-icon-box", iconColor)}>
              <AppIcon name={title} icon={Icon} size={16} className="w-4 h-4" />
            </div>
          )}
          {badge && (
            <span className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
              {badge}
            </span>
          )}
        </div>
        <h1 className="crm-page-title tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="crm-description max-w-2xl">
            {subtitle}
          </p>
        )}
      </motion.div>

      {actions && actions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex w-full flex-row gap-2 sm:w-auto sm:gap-2.5 sm:items-center"
        >
          {actions.map((action, index) => {
            const isPrimary = index === actions.length - 1;
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || (isPrimary ? "default" : "outline")}
                size="sm"
                className="flex-1 sm:flex-none text-xs font-semibold h-9 px-3.5"
              >
                {action.icon && (
                  <AppIcon
                    name={action.label}
                    icon={action.icon}
                    size={14}
                    className="w-3.5 h-3.5 mr-1.5 shrink-0"
                  />
                )}
                {action.label}
              </Button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};











