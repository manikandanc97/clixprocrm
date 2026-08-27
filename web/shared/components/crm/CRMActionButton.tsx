"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface CRMActionButtonProps {
  label?: string;
  name?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  iconOnly?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-xs";
}

export const CRMActionButton = ({
  label,
  name,
  icon: Icon,
  onClick,
  variant = "outline",
  iconOnly = false,
  className,
  size,
}: CRMActionButtonProps) => {
  const buttonSize = size || (iconOnly ? "icon" : "default");

  return (
    <Button
      variant={variant}
      size={buttonSize}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      className={className}
    >
      {(Icon || name || label) && (
        <AppIcon
          icon={Icon}
          name={name || label}
          size={16}
          className="h-4 w-4"
        />
      )}
      {!iconOnly && label && <span className="ml-1.5">{label}</span>}
    </Button>
  );
};
