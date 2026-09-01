"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical, MoreHorizontal, Loader2, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/shared/ui/dropdown-menu";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export interface CRMActionMenuItemConfig {
  key?: string | number;
  label: React.ReactNode;
  icon?: LucideIcon | string | React.ComponentType<{ className?: string; size?: number }>;
  iconColor?: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  variant?: "default" | "primary" | "destructive";
  disabled?: boolean;
  hidden?: boolean;
  separatorBefore?: boolean;
  separatorAfter?: boolean;
  className?: string;
  loading?: boolean;
}

export interface CRMActionMenuProps {
  items?: CRMActionMenuItemConfig[];
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  triggerOrientation?: "vertical" | "horizontal";
  triggerVariant?: "ghost" | "outline" | "secondary";
  triggerSize?: "icon" | "icon-sm" | "sm" | "default";
  triggerClassName?: string;
  triggerTooltip?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  width?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function CRMActionMenu({
  items,
  children,
  trigger,
  triggerOrientation = "vertical",
  triggerVariant = "ghost",
  triggerSize = "icon",
  triggerClassName,
  triggerTooltip = "Actions",
  align = "end",
  side = "bottom",
  sideOffset = 6,
  width = "w-48 sm:w-52",
  className,
  open,
  onOpenChange,
  disabled = false,
  "aria-label": ariaLabel = "Actions menu",
}: CRMActionMenuProps) {
  const TriggerIcon = triggerOrientation === "horizontal" ? MoreHorizontal : MoreVertical;

  const defaultTrigger = (
    <Button
      variant={triggerVariant}
      size={triggerSize}
      disabled={disabled}
      aria-label={ariaLabel}
      title={triggerTooltip}
      className={cn(
        "h-8 w-8 p-0 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted/80",
        "transition-all duration-150 cursor-pointer",
        "data-[state=open]:bg-primary/12 data-[state=open]:text-primary data-[state=open]:border-primary/25 data-[state=open]:shadow-xs",
        triggerClassName
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <TriggerIcon className="h-4 w-4 shrink-0 transition-transform duration-150" />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  );

  return (
    <div
      className="inline-flex items-center justify-end select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          {trigger ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center cursor-pointer"
            >
              {trigger}
            </div>
          ) : (
            defaultTrigger
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          avoidCollisions={true}
          collisionPadding={8}
          className={cn(
            // Minimal-style premium SaaS popover styling matching reference
            "z-50 min-w-[168px] p-1.5 rounded-2xl border border-border/75 dark:border-border/60",
            "bg-popover bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_5.5%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_3.5%,transparent)_0%,transparent_45%)]",
            "dark:bg-card dark:bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_5.5%,transparent)_0%,transparent_45%)]",
            "shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04)]",
            "dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5),0_6px_16px_-2px_rgba(0,0,0,0.35)]",
            "backdrop-blur-none text-foreground font-sans",
            width,
            className
          )}
        >
          {items && items.length > 0
            ? items
                .filter((item) => !item.hidden)
                .map((item, index) => {
                  const itemKey = item.key ?? `action-item-${index}`;
                  const isDestructive = item.variant === "destructive";
                  const isPrimary = item.variant === "primary";

                  const content = (
                    <React.Fragment key={itemKey}>
                      {item.separatorBefore && <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />}
                      <DropdownMenuItem
                        variant={isDestructive ? "destructive" : "default"}
                        disabled={item.disabled || item.loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.disabled && !item.loading && item.onClick) {
                            item.onClick(e);
                          }
                        }}
                        className={cn(
                          "min-h-[34px] px-2.5 py-1.5 text-[13px] font-medium leading-none gap-2.5 rounded-xl cursor-pointer",
                          "transition-all duration-140 outline-hidden select-none",
                          "hover:bg-primary/[0.07] hover:text-foreground focus:bg-primary/[0.07] focus:text-foreground",
                          isPrimary && "text-primary font-medium hover:bg-primary/10 focus:bg-primary/10",
                          isDestructive &&
                            "text-[#f95738] dark:text-[#ff6b4a] font-medium hover:bg-rose-500/10 hover:text-[#f95738] focus:bg-rose-500/10 focus:text-[#f95738]",
                          item.className
                        )}
                      >
                        {item.loading ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : item.icon ? (
                          typeof item.icon === "string" ? (
                            <AppIcon
                              name={item.icon}
                              size={15}
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                isDestructive
                                  ? "text-[#f95738] dark:text-[#ff6b4a]"
                                  : isPrimary
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover/dropdown-menu-item:text-foreground",
                                item.iconColor
                              )}
                            />
                          ) : (
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                isDestructive
                                  ? "text-[#f95738] dark:text-[#ff6b4a]"
                                  : isPrimary
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover/dropdown-menu-item:text-foreground",
                                item.iconColor
                              )}
                            />
                          )
                        ) : null}
                        <span className="truncate flex-1">{item.label}</span>
                      </DropdownMenuItem>
                      {item.separatorAfter && <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />}
                    </React.Fragment>
                  );

                  if (item.href && !item.disabled) {
                    return (
                      <Link key={itemKey} href={item.href} className="no-underline block">
                        {content}
                      </Link>
                    );
                  }

                  return content;
                })
            : children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export interface CRMActionMenuItemProps extends Omit<React.ComponentProps<typeof DropdownMenuItem>, "variant"> {
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  name?: string;
  variant?: "default" | "primary" | "destructive";
  iconClassName?: string;
}

export function CRMActionMenuItem({
  children,
  icon: Icon,
  name,
  variant = "default",
  disabled = false,
  onClick,
  className,
  iconClassName,
  ...props
}: CRMActionMenuItemProps) {
  const isDestructive = variant === "destructive";
  const isPrimary = variant === "primary";

  return (
    <DropdownMenuItem
      variant={isDestructive ? "destructive" : "default"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) onClick(e);
      }}
      className={cn(
        "min-h-[34px] px-2.5 py-1.5 text-[13px] font-medium leading-none gap-2.5 rounded-xl cursor-pointer",
        "transition-all duration-140 outline-hidden select-none",
        "hover:bg-primary/[0.07] hover:text-foreground focus:bg-primary/[0.07] focus:text-foreground",
        isPrimary && "text-primary font-medium hover:bg-primary/10 focus:bg-primary/10",
        isDestructive &&
          "text-[#f95738] dark:text-[#ff6b4a] font-medium hover:bg-rose-500/10 hover:text-[#f95738] focus:bg-rose-500/10 focus:text-[#f95738]",
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isDestructive
              ? "text-[#f95738] dark:text-[#ff6b4a]"
              : isPrimary
              ? "text-primary"
              : "text-muted-foreground group-hover/dropdown-menu-item:text-foreground",
            iconClassName
          )}
        />
      ) : name ? (
        <AppIcon
          name={name}
          size={15}
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isDestructive
              ? "text-[#f95738] dark:text-[#ff6b4a]"
              : isPrimary
              ? "text-primary"
              : "text-muted-foreground group-hover/dropdown-menu-item:text-foreground",
            iconClassName
          )}
        />
      ) : null}
      <span className="truncate flex-1">{children}</span>
    </DropdownMenuItem>
  );
}

export const CRMActionMenuSeparator = DropdownMenuSeparator;
export const CRMActionMenuLabel = DropdownMenuLabel;
export const ActionMenu = CRMActionMenu;
export const ActionMenuItem = CRMActionMenuItem;
export const ActionMenuSeparator = CRMActionMenuSeparator;
