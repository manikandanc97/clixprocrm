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
  children?: React.ReactNode;
  className?: string;
}

export const CRMPageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-muted-foreground",
  badge,
  actions,
  children,
  className,
}: CRMPageHeaderProps) => {
  return (
    <div className={cn("flex flex-col justify-between gap-3 sm:flex-row sm:items-center", className)}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        {Icon && (
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name={title}
              icon={Icon}
              size={18}
              className={cn("w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors", iconColor)}
            />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-xs">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>

      {(children || (actions && actions.length > 0)) && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex w-full flex-row gap-2 sm:w-auto sm:gap-2.5 sm:items-center shrink-0"
        >
          {children}
          {actions && actions.map((action, index) => {
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











