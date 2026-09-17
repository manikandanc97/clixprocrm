"use client";

import * as React from "react";
import { MoreHorizontal, ChevronLeft, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

export interface EntityMetadataItem {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export interface EntityActionItem {
  id: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

export interface EntityHeaderProps {
  // Identity
  title: string;
  subtitle?: React.ReactNode;
  avatarUrl?: string | null;
  avatarInitials?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  iconBg?: string;

  // Status & Badges
  status?: React.ReactNode;
  badges?: React.ReactNode[];

  // Metadata items
  metadata?: EntityMetadataItem[];

  // Actions
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  overflowActions?: EntityActionItem[];

  // Navigation
  onBack?: () => void;
  backLabel?: string;

  className?: string;
}

export function EntityHeader({
  title,
  subtitle,
  avatarUrl,
  avatarInitials,
  icon: IconComponent,
  iconBg = "bg-primary/10 text-primary border-primary/20",
  status,
  badges = [],
  metadata = [],
  primaryAction,
  secondaryActions,
  overflowActions = [],
  onBack,
  backLabel = "Back",
  className,
}: EntityHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border/80 bg-card p-5 sm:p-6 rounded-t-xl transition-all duration-200",
        className
      )}
    >
      {/* Optional Top Back Link */}
      {onBack && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <ChevronLeft className="size-3.5" />
            <span>{backLabel}</span>
          </Button>
        </div>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar/Icon + Title + Badges */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {avatarUrl !== undefined || avatarInitials ? (
            <Avatar className="size-11 sm:size-12 rounded-xl border border-border shadow-xs shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
              <AvatarFallback className="rounded-xl text-sm font-bold bg-primary/10 text-primary">
                {avatarInitials || title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : IconComponent ? (
            <div
              className={cn(
                "size-11 sm:size-12 rounded-xl flex items-center justify-center border shrink-0 shadow-xs",
                iconBg
              )}
            >
              <IconComponent className="size-5 sm:size-6" />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {status && <div className="shrink-0">{status}</div>}
              {badges.map((badge, idx) => (
                <div key={idx} className="shrink-0">
                  {badge}
                </div>
              ))}
            </div>

            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 w-full sm:w-auto justify-end">
          {secondaryActions}
          {primaryAction}

          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="More actions"
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                {overflowActions.map((action, idx) => {
                  const ActionIcon = action.icon;
                  const isDestructive = action.variant === "destructive";
                  return (
                    <React.Fragment key={action.id || idx}>
                      <DropdownMenuItem
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                          "flex items-center gap-2 text-xs py-2 px-2.5 rounded-md cursor-pointer",
                          isDestructive && "text-destructive focus:text-destructive focus:bg-destructive/10"
                        )}
                      >
                        {ActionIcon && <ActionIcon className="size-3.5 shrink-0" />}
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                      {idx < overflowActions.length - 1 && isDestructive && (
                        <DropdownMenuSeparator />
                      )}
                    </React.Fragment>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Secondary Metadata Grid */}
      {metadata.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-border/50 text-xs">
          {metadata.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-1.5 min-w-0">
                {ItemIcon && (
                  <ItemIcon className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-muted-foreground font-medium">
                  {item.label}:
                </span>
                <span className="text-foreground font-semibold truncate">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
