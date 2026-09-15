"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { UserAvatar } from "@/features/help-center/components/ticket-history/UserAvatar";
import {
  STATUS_CONFIG,
  CATEGORY_OPTIONS,
} from "@/features/help-center/components/ticket-shared";

interface TicketModalSidebarProps {
  ticket: PlatformSupportTicket;
  currentUserId?: string;
  currentUserName?: string;
  savingStatus: boolean;
  onStatusChange: (status: string) => void;
  savingPriority: boolean;
  onPriorityChange: (priority: string) => void;
  savingAssignee: boolean;
  onAssigneeChange: (assigneeId: string) => void;
  savingCategory: boolean;
  onCategoryChange: (category: string) => void;
}

export function TicketModalSidebar({
  ticket,
  currentUserId,
  currentUserName,
  savingStatus,
  onStatusChange,
  savingPriority,
  onPriorityChange,
  savingAssignee,
  onAssigneeChange,
  savingCategory,
  onCategoryChange,
}: TicketModalSidebarProps) {
  return (
    <div className="lg:col-span-4 space-y-4">
      {/* Triage Settings Card */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
          Ticket Management
        </h3>

        {/* Status Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted-foreground">Status</label>
            {savingStatus && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <Select value={ticket.status} onValueChange={onStatusChange} disabled={savingStatus}>
            <SelectTrigger className="h-8.5 text-xs font-semibold px-3 rounded-lg border bg-background w-full gap-2 shadow-2xs cursor-pointer">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse shrink-0",
                    STATUS_CONFIG[ticket.status]?.dotClass || "bg-blue-500"
                  )}
                />
                <SelectValue placeholder="Select status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted-foreground">Priority</label>
            {savingPriority && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <Select value={ticket.priority} onValueChange={onPriorityChange} disabled={savingPriority}>
            <SelectTrigger className="h-8.5 text-xs font-semibold px-3 rounded-lg border bg-background w-full gap-2 shadow-2xs cursor-pointer">
              <span className="flex items-center gap-1.5">
                {ticket.priority === "CRITICAL" && (
                  <AppIcon name="alert" size={13} className="text-rose-500 shrink-0" />
                )}
                <SelectValue placeholder="Select priority" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted-foreground">Assignee</label>
            {savingAssignee && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <Select
            value={ticket.assignedToId || "unassigned"}
            onValueChange={onAssigneeChange}
            disabled={savingAssignee}
          >
            <SelectTrigger className="h-8.5 text-xs font-semibold px-3 rounded-lg border bg-background w-full gap-2 shadow-2xs cursor-pointer">
              <AppIcon name="userPlus" size={13} className="text-muted-foreground shrink-0" />
              <span className="truncate">
                <SelectValue placeholder="Assignee" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {currentUserId && (
                <SelectItem value={currentUserId}>
                  Assign to Me ({currentUserName || "Super Admin"})
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted-foreground">Category</label>
            {savingCategory && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <Select
            value={ticket.category || "General Inquiry"}
            onValueChange={onCategoryChange}
            disabled={savingCategory}
          >
            <SelectTrigger className="h-8.5 text-xs font-semibold px-3 rounded-lg border bg-background w-full gap-2 shadow-2xs cursor-pointer">
              <AppIcon name="tag" size={13} className="text-muted-foreground shrink-0" />
              <span className="truncate">
                <SelectValue placeholder="Select category" />
              </span>
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Organization & Customer Contact Info */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
          Customer & Workspace
        </h3>

        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Customer</span>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/50">
            <UserAvatar name={ticket.createdBy?.name || "Customer"} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {ticket.createdBy?.name || "Customer"}
              </p>
              {ticket.createdBy?.email && (
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {ticket.createdBy.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {ticket.tenant && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Workspace</span>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{ticket.tenant.name}</span>
                {ticket.tenant.plan && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {ticket.tenant.plan}
                  </span>
                )}
              </div>
              {ticket.tenant.slug && (
                <span className="text-[10px] text-muted-foreground font-mono block">
                  @{ticket.tenant.slug}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
