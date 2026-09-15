"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./ticket-shared.constants";

export function TicketStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const normStatus = (status || "OPEN").toUpperCase();
  const cfg = STATUS_CONFIG[normStatus] || {
    label: status || "Open",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        cfg.badgeClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
  className,
}: {
  priority?: string;
  className?: string;
}) {
  const normPriority = (priority || "MEDIUM").toUpperCase();
  const cfg = PRIORITY_CONFIG[normPriority] || {
    label: priority || "Medium",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        cfg.badgeClass,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
