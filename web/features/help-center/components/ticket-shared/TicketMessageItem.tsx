"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime } from "@/shared/utils/formatters";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { UserAvatar } from "../ticket-history/UserAvatar";

export interface SharedTicketMessage {
  id: string;
  message: string;
  isStaff?: boolean;
  isInternal?: boolean;
  createdAt: string;
  sender?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
}

export interface TicketMessageItemProps {
  message: SharedTicketMessage;
  currentUserId?: string;
  currentUserName?: string;
  isSuperAdminView?: boolean;
}

export function TicketMessageItem({
  message,
  currentUserName,
  isSuperAdminView = false,
}: TicketMessageItemProps) {
  const isStaff = Boolean(message.isStaff);
  const isInternal = Boolean(message.isInternal);

  const senderName =
    message.sender?.name ||
    (isStaff ? "Support Team" : currentUserName || "User");

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden shadow-xs transition-colors",
        isInternal
          ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
          : isStaff
          ? "border-primary/25 bg-card ring-1 ring-primary/8"
          : "border-border/70 bg-card"
      )}
    >
      <div
        className={cn(
          "px-5 py-3 border-b flex items-center justify-between gap-2",
          isInternal
            ? "bg-amber-500/10 border-amber-500/20"
            : isStaff
            ? "bg-primary/5 border-primary/15"
            : "bg-muted/25 border-border/50"
        )}
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            name={senderName}
            isStaff={isStaff}
            size="sm"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-foreground">
              {senderName}
            </span>
            {isInternal ? (
              <span className="text-[9px] font-bold bg-amber-500 text-amber-950 dark:text-amber-900 py-0.5 px-2 rounded-full flex items-center gap-1">
                <AppIcon name="lock" size={10} /> Internal Note
              </span>
            ) : isStaff ? (
              <span className="text-[9px] font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full flex items-center gap-1">
                <AppIcon name="circleCheck" size={11} className="text-primary-foreground" />{" "}
                {isSuperAdminView ? "Super Admin" : "Support Representative"}
              </span>
            ) : (
              <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Author
              </span>
            )}
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium shrink-0">
          <AppIcon name="clock" size={12} className="opacity-50" />
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>

      <div className="p-5 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {message.message}
      </div>
    </div>
  );
}
