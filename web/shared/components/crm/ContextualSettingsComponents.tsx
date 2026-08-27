"use client";

import React, { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { LucideIcon, HelpCircle } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface SettingsSectionProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function SettingsSection({
  title,
  description,
  badge,
  icon: Icon,
  children,
  className,
  headerAction,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-border/50">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
            <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
              {title}
            </h4>
            {badge && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 font-medium border-primary/20 bg-primary/5 text-primary"
              >
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div className="pt-4 space-y-4">{children}</div>
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  tooltip?: string;
  badge?: string;
  children?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function SettingsRow({
  label,
  description,
  tooltip,
  badge,
  children,
  icon: Icon,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 text-xs",
        className
      )}
    >
      <div className="space-y-0.5 max-w-lg min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <span className="font-medium text-foreground">{label}</span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-normal">
              {badge}
            </Badge>
          )}
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="w-3 h-3 text-muted-foreground/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-muted-foreground leading-normal">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-end">{children}</div>
    </div>
  );
}

interface SettingsToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: string;
  tooltip?: string;
  icon?: LucideIcon;
  className?: string;
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  badge,
  tooltip,
  icon,
  className,
}: SettingsToggleRowProps) {
  return (
    <SettingsRow
      label={label}
      description={description}
      badge={badge}
      tooltip={tooltip}
      icon={icon}
      className={className}
    >
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />
    </SettingsRow>
  );
}

interface SettingsFieldProps {
  label: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  description,
  tooltip,
  required,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-3 h-3 text-muted-foreground/70" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {description && (
        <p className="text-[11px] text-muted-foreground leading-normal">
          {description}
        </p>
      )}
    </div>
  );
}
