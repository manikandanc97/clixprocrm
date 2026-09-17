"use client";

import React from "react";
import {
  Ticket,
  MoreVertical,
  Trash2,
  Eye,
  Copy,
  Check,
  UserCheck,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatTicketCode } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  SupportSortConfig,
  SupportSortKey,
} from "./support-types";

interface SupportTicketsTableProps {
  tickets: PlatformSupportTicket[];
  loading: boolean;
  selectedTicketIds: string[];
  onToggleSelectTicket: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  sortConfig: SupportSortConfig | null;
  onSort: (key: SupportSortKey) => void;
  onOpenTicket: (ticket: PlatformSupportTicket) => void;
  onSelectTicketToDelete: (ticket: PlatformSupportTicket) => void;
  copiedId: string | null;
  onCopyId: (id: string, e?: React.MouseEvent) => void;
  formatDate: (dateStr: string) => { date: string; time: string };
}

export function SupportTicketsTable({
  tickets,
  loading,
  selectedTicketIds,
  onToggleSelectTicket,
  onToggleSelectAll,
  sortConfig,
  onSort,
  onOpenTicket,
  onSelectTicketToDelete,
  copiedId,
  onCopyId,
  formatDate,
}: SupportTicketsTableProps) {
  const isAllSelected =
    tickets.length > 0 && tickets.every((t) => selectedTicketIds.includes(t.id));

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
      <table className="w-full text-left text-xs border-collapse min-w-[1000px] table-fixed">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "280px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "125px" }} />
          <col style={{ width: "145px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "64px" }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-muted border-b border-border shadow-xs">
          <tr className="text-xs font-bold text-foreground">
            <th className="w-12 px-4 py-3.5 text-center bg-muted border-r border-border/60">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("ticketNumber")}
            >
              <div className="flex items-center gap-1.5">
                <span>T-No</span>
                {sortConfig?.key === "ticketNumber" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("subject")}
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
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("createdBy")}
            >
              <div className="flex items-center gap-1.5">
                <span>Raised By</span>
                {sortConfig?.key === "createdBy" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("priority")}
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
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("status")}
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
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("assignedTo")}
            >
              <div className="flex items-center gap-1.5">
                <span>Assigned To</span>
                {sortConfig?.key === "assignedTo" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => onSort("createdAt")}
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
            <th className="w-16 px-4 py-3.5 text-right bg-muted">
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
                  <div className="h-4 w-16 bg-muted rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-48 bg-muted rounded" />
                    <div className="h-2.5 w-24 bg-muted/60 rounded" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-muted rounded" />
                    <div className="h-2.5 w-20 bg-muted/60 rounded" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 w-16 bg-muted rounded-md" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 w-20 bg-muted rounded-md" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 bg-muted rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 bg-muted rounded" />
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="h-6 w-6 bg-muted rounded ml-auto" />
                </td>
              </tr>
            ))
          ) : tickets.length > 0 ? (
            tickets.map((t) => {
              const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
              const priorityInfo = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
              const ticketDisplayCode = formatTicketCode(t);
              const { date, time } = formatDate(t.createdAt);
              const isSelected = selectedTicketIds.includes(t.id);

              return (
                <tr
                  key={t.id}
                  className={cn(
                    "group h-16 hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/[0.03]"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectTicket(t.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Ticket Number / Reference */}
                  <td className="px-4 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => onOpenTicket(t)}
                        className="hover:underline cursor-pointer"
                      >
                        {ticketDisplayCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => onCopyId(t.ticketNumber || ticketDisplayCode, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                        title={`Copy Reference (${t.ticketNumber || ticketDisplayCode})`}
                      >
                        {copiedId === (t.ticketNumber || ticketDisplayCode) ? (
                          <AppIcon name="check" icon={Check} size={13} className="text-emerald-500" />
                        ) : (
                          <AppIcon name="copy" icon={Copy} size={13} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Subject & Category */}
                  <td className="px-4 py-3.5 overflow-hidden">
                    <div className="min-w-0 max-w-[250px]">
                      <p
                        onClick={() => onOpenTicket(t)}
                        className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                      >
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {t.category ? (
                          <span className="capitalize">{t.category.toLowerCase().replace(/_/g, " ")}</span>
                        ) : (
                          "General Inquiry"
                        )}
                      </p>
                    </div>
                  </td>

                  {/* Raised By / Workspace */}
                  <td className="px-4 py-3.5 overflow-hidden">
                    <div className="min-w-0 max-w-[130px]">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {t.createdBy?.name || "Customer"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {t.tenant?.name ? (
                          <span>{t.tenant.name}</span>
                        ) : (
                          t.createdBy?.email || "Unknown"
                        )}
                      </p>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border shadow-xs",
                        priorityInfo.badgeClass
                      )}
                    >
                      {priorityInfo.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                        statusInfo.badgeClass
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.dotClass)} />
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* Assigned To */}
                  <td className="px-4 py-3.5 text-xs font-semibold text-foreground overflow-hidden">
                    {t.assignedTo ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 max-w-[150px]">
                        <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-semibold truncate text-xs">
                          {t.assignedTo.name || t.assignedTo.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-foreground">{date}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
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
                        className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                      >
                        <DropdownMenuItem
                          onClick={() => onOpenTicket(t)}
                          className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                        >
                          <AppIcon
                            name="overview"
                            icon={Eye}
                            size={14}
                            className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                          />
                          <span>View Ticket</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          onClick={() => onSelectTicketToDelete(t)}
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
                    description="No tickets match your search or filter criteria."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
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
