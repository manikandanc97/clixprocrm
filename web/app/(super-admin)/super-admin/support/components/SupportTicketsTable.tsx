"use client";

import React, { useMemo } from "react";
import {
  Ticket,
  Eye,
  Trash2,
  Copy,
  Check,
  UserCheck,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu, CRMActionMenuItemConfig } from "@/shared/components/crm/CRMActionMenu";
import { formatTicketCode } from "@/shared/components/crm";
import { Checkbox } from "@/shared/ui/checkbox";
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

  const columns = useMemo<CRMDataTableColumn<PlatformSupportTicket>[]>(() => {
    return [
      // 1. Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
              aria-label="Select all tickets on this page"
            />
          </div>
        ),
        cell: (t) => {
          const isSelected = selectedTicketIds.includes(t.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelectTicket(t.id)}
                aria-label={`Select ticket ${t.ticketNumber}`}
              />
            </div>
          );
        },
        className: "w-12 px-3 text-center",
        headerClassName: "w-12 px-3 text-center",
        align: "center",
      },

      // 2. Ticket Number
      {
        header: "T-No",
        sortable: true,
        sortDirection: sortConfig?.key === "ticketNumber" ? sortConfig.direction : null,
        onSort: (dir) => onSort("ticketNumber"),
        cell: (t) => {
          const ticketDisplayCode = formatTicketCode(t);
          return (
            <div className="flex items-center gap-1.5 font-mono font-bold text-primary whitespace-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTicket(t);
                }}
                className="hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
              >
                {ticketDisplayCode}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyId(t.ticketNumber || ticketDisplayCode, e);
                }}
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
          );
        },
        className: "w-[120px]",
      },

      // 3. Subject
      {
        header: "Subject",
        sortable: true,
        sortDirection: sortConfig?.key === "subject" ? sortConfig.direction : null,
        onSort: (dir) => onSort("subject"),
        cell: (t) => (
          <div className="min-w-0 max-w-[250px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTicket(t);
              }}
              className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate text-left block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              {t.subject}
            </button>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {t.category ? (
                <span className="capitalize">{t.category.toLowerCase().replace(/_/g, " ")}</span>
              ) : (
                "General Inquiry"
              )}
            </p>
          </div>
        ),
        className: "min-w-[200px] max-w-[280px]",
      },

      // 4. Raised By
      {
        header: "Raised By",
        sortable: true,
        sortDirection: sortConfig?.key === "createdBy" ? sortConfig.direction : null,
        onSort: (dir) => onSort("createdBy"),
        cell: (t) => (
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
        ),
        className: "w-[140px]",
      },

      // 5. Priority
      {
        header: "Priority",
        sortable: true,
        sortDirection: sortConfig?.key === "priority" ? sortConfig.direction : null,
        onSort: (dir) => onSort("priority"),
        cell: (t) => {
          const priorityInfo = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border shadow-xs",
                priorityInfo.badgeClass
              )}
            >
              {priorityInfo.label}
            </span>
          );
        },
        className: "w-[100px]",
      },

      // 6. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortConfig?.key === "status" ? sortConfig.direction : null,
        onSort: (dir) => onSort("status"),
        cell: (t) => {
          const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                statusInfo.badgeClass
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.dotClass)} />
              {statusInfo.label}
            </span>
          );
        },
        className: "w-[125px]",
      },

      // 7. Assigned To
      {
        header: "Assigned To",
        sortable: true,
        sortDirection: sortConfig?.key === "assignedTo" ? sortConfig.direction : null,
        onSort: (dir) => onSort("assignedTo"),
        cell: (t) => {
          return t.assignedTo ? (
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 max-w-[150px]">
              <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground font-semibold truncate text-xs">
                {t.assignedTo.name || t.assignedTo.email}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
          );
        },
        className: "w-[145px]",
      },

      // 8. Created Date
      {
        header: "Created Date",
        sortable: true,
        sortDirection: sortConfig?.key === "createdAt" ? sortConfig.direction : null,
        onSort: (dir) => onSort("createdAt"),
        cell: (t) => {
          const { date, time } = formatDate(t.createdAt);
          return (
            <div>
              <p className="text-xs font-semibold text-foreground">{date}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
            </div>
          );
        },
        className: "w-[140px]",
      },

      // 9. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (t) => {
          const actionItems: CRMActionMenuItemConfig[] = [
            {
              label: "View Ticket",
              icon: Eye,
              variant: "primary" as const,
              onClick: () => onOpenTicket(t),
            },
            {
              label: "Delete Ticket",
              icon: Trash2,
              variant: "destructive" as const,
              separatorBefore: true,
              onClick: () => onSelectTicketToDelete(t),
            },
          ];

          return (
            <CRMActionMenu
              items={actionItems}
              aria-label={`Actions for ticket ${t.ticketNumber}`}
              triggerTooltip="Ticket actions"
            />
          );
        },
        className: "w-16 text-right",
        headerClassName: "w-16 text-right",
      },
    ];
  }, [
    isAllSelected,
    selectedTicketIds,
    sortConfig,
    copiedId,
    onSort,
    onToggleSelectAll,
    onToggleSelectTicket,
    onOpenTicket,
    onCopyId,
    onSelectTicketToDelete,
    formatDate,
  ]);

  return (
    <CRMDataTable<PlatformSupportTicket>
      data={tickets}
      columns={columns}
      isLoading={loading}
      isError={false}
      emptyIcon={Ticket}
      emptyTitle="No support tickets found"
      emptyDescription="No tickets match your search or filter criteria."
      hasPagination={false}
      rowClassName={(t) =>
        cn(
          "transition-colors",
          selectedTicketIds.includes(t.id) && "bg-primary/[0.03]"
        )
      }
    />
  );
}
