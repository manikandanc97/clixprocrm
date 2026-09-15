"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Ticket,
  RotateCcw,
  Trash2,
  MoreVertical,
  Edit,
  Eye,
  Paperclip,
  MessageSquare,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { TruncatedText } from "@/shared/components/TruncatedText";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  TicketItem,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "./ticket-history.types";
import { UserAvatar } from "./UserAvatar";

interface TicketHistoryTableProps {
  loading: boolean;
  paginatedTickets: TicketItem[];
  selectedTicketIds: string[];
  setSelectedTicketIds: React.Dispatch<React.SetStateAction<string[]>>;
  sortConfig: {
    key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt";
    direction: "asc" | "desc";
  } | null;
  setSort: (key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt") => void;
  handleSelectTicket: (ticket: TicketItem) => void;
  canManageTicket: (ticket: TicketItem) => boolean;
  handleOpenEdit: (ticket: TicketItem, e?: React.MouseEvent) => void;
  handleOpenDelete: (ticket: TicketItem, e?: React.MouseEvent) => void;
  copyId: (id: string, e?: React.MouseEvent) => void;
  copiedId: string | null;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  onNewTicketClick?: () => void;
}

export function TicketHistoryTable({
  loading,
  paginatedTickets,
  selectedTicketIds,
  setSelectedTicketIds,
  sortConfig,
  setSort,
  handleSelectTicket,
  canManageTicket,
  handleOpenEdit,
  handleOpenDelete,
  copyId,
  copiedId,
  hasActiveFilters,
  handleClearFilters,
  onNewTicketClick,
}: TicketHistoryTableProps) {
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return { date: "—", time: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
      <table className="w-full text-left text-xs border-collapse min-w-[1050px] table-fixed">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "280px" }} />
          <col style={{ width: "180px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "64px" }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
          <tr className="text-xs font-bold text-foreground">
            {/* Checkbox Header */}
            <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
              <input
                type="checkbox"
                checked={
                  paginatedTickets.length > 0 &&
                  paginatedTickets.every((t) =>
                    selectedTicketIds.includes(t.ticketId || t.id)
                  )
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    const pageIds = paginatedTickets.map((t) => t.ticketId || t.id);
                    setSelectedTicketIds(
                      Array.from(new Set([...selectedTicketIds, ...pageIds]))
                    );
                  } else {
                    const pageIds = new Set(
                      paginatedTickets.map((t) => t.ticketId || t.id)
                    );
                    setSelectedTicketIds(
                      selectedTicketIds.filter((id) => !pageIds.has(id))
                    );
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </th>

            {/* Ticket ID */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("ticketId")}
            >
              <div className="flex items-center gap-1.5">
                <span>Ticket ID</span>
                {sortConfig?.key === "ticketId" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Subject */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("subject")}
            >
              <div className="flex items-center gap-1.5">
                <span>Subject</span>
                {sortConfig?.key === "subject" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Requester */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("userName")}
            >
              <div className="flex items-center gap-1.5">
                <span>Requester</span>
                {sortConfig?.key === "userName" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Category */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("category")}
            >
              <div className="flex items-center gap-1.5">
                <span>Category</span>
                {sortConfig?.key === "category" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Priority */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("priority")}
            >
              <div className="flex items-center gap-1.5">
                <span>Priority</span>
                {sortConfig?.key === "priority" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Status */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("status")}
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                {sortConfig?.key === "status" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Created Date */}
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("createdAt")}
            >
              <div className="flex items-center gap-1.5">
                <span>Created Date</span>
                {sortConfig?.key === "createdAt" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>

            {/* Actions */}
            <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/40 text-xs">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse h-16">
                <td className="px-4 py-4 text-center">
                  <div className="h-4 w-4 bg-muted rounded mx-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-20 bg-muted rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted/60 rounded" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-muted rounded-full shrink-0" />
                    <div className="h-3.5 w-24 bg-muted rounded" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-24 bg-muted rounded-md" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-16 bg-muted rounded-md" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-20 bg-muted rounded-full" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-3.5 w-20 bg-muted rounded" />
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="h-7 w-7 bg-muted rounded ml-auto" />
                </td>
              </tr>
            ))
          ) : paginatedTickets.length > 0 ? (
            paginatedTickets.map((ticket) => {
              const isSelected = selectedTicketIds.includes(
                ticket.ticketId || ticket.id
              );
              const statusStyle =
                STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              const priorityStyle =
                PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
              const { date, time } = formatDate(ticket.createdAt);
              const hasReplies = ticket.replies && ticket.replies.length > 0;
              const hasAttachments =
                ticket.attachments && ticket.attachments.length > 0;

              return (
                <tr
                  key={ticket.id || ticket.ticketId}
                  className={cn(
                    "group h-16 hover:bg-muted/30 transition-colors cursor-pointer",
                    isSelected && "bg-primary/[0.03]"
                  )}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  {/* Checkbox */}
                  <td
                    className="px-4 py-3.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const id = ticket.ticketId || ticket.id;
                        setSelectedTicketIds((prev) =>
                          prev.includes(id)
                            ? prev.filter((item) => item !== id)
                            : [...prev, id]
                        );
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Ticket Code */}
                  <td className="px-4 py-3.5 font-medium overflow-hidden">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => copyId(ticket.ticketId, e)}
                      className="font-mono text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20"
                      title={`Click to copy ID (${ticket.ticketId})`}
                    >
                      <span>{formatTicketCode(ticket)}</span>
                      {copiedId === ticket.ticketId ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </div>
                  </td>

                  {/* Subject & Activity indicators */}
                  <td className="px-4 py-3.5 overflow-hidden">
                    <div className="min-w-0 pr-2">
                      <TruncatedText
                        text={ticket.subject}
                        lines={1}
                        className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      />
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        {hasAttachments && (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                            <Paperclip className="h-3 w-3 text-primary" />
                            {ticket.attachments?.length}
                          </span>
                        )}
                        {hasReplies && (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-primary/10 px-1.5 py-0.2 rounded text-primary">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.replies?.length}
                          </span>
                        )}
                        <span className="truncate">{formatRelativeTime(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Requester */}
                  <td className="px-4 py-3.5 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={ticket.userName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {ticket.userName || "User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {ticket.userEmail || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/40 inline-block truncate max-w-[130px]">
                      {ticket.category || "General Inquiry"}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                        priorityStyle.color
                      )}
                    >
                      {priorityStyle.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5",
                        statusStyle.color
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusStyle.dot)} />
                      {statusStyle.label}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-foreground">{date}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                  </td>

                  {/* Actions */}
                  <td
                    className="px-4 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                      >
                        <DropdownMenuItem
                          onClick={() => handleSelectTicket(ticket)}
                          className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                        >
                          <AppIcon
                            name="eye"
                            icon={Eye}
                            size={14}
                            className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                          />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        {canManageTicket(ticket) && ticket.status !== "CLOSED" && (
                          <DropdownMenuItem
                            onClick={(e) => handleOpenEdit(ticket, e)}
                            className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                          >
                            <AppIcon
                              name="edit"
                              icon={Edit}
                              size={14}
                              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                            />
                            <span>Edit Ticket</span>
                          </DropdownMenuItem>
                        )}

                        {canManageTicket(ticket) && (
                          <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={(e) => handleOpenDelete(ticket, e)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Ticket</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="p-6 text-center text-muted-foreground align-middle border-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <EmptyState
                    icon={Ticket}
                    title="No support tickets found"
                    description={
                      hasActiveFilters
                        ? "No tickets match your current search or filter criteria."
                        : "You haven't submitted any support requests yet. If you need assistance, our support engineers are here to help."
                    }
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear Filters",
                            onClick: handleClearFilters,
                            icon: RotateCcw,
                          }
                        : onNewTicketClick
                        ? {
                            label: "Submit a Ticket",
                            onClick: onNewTicketClick,
                            icon: Plus,
                          }
                        : undefined
                    }
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
