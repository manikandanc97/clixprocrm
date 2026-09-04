"use client";

import React, { useMemo } from "react";
import { Mail, Phone, Edit, Trash2, Users, RotateCcw, UserPlus } from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu, CRMActionMenuItemConfig } from "@/shared/components/crm/CRMActionMenu";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import type { ContactItem } from "../hooks/use-contacts-data";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";
import type { ContactSettingsConfig } from "../hooks/use-contact-settings";

interface ContactsDataTableProps {
  contacts: ContactItem[];
  selectedContactIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string, direction: SortDirection) => void;
  currency: string;
  contactSettings: ContactSettingsConfig;
  isLoading: boolean;
  isError: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  onEditContact: (contact: ContactItem) => void;
  onDeleteContact: (contact: ContactItem) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddContact: () => void;
}

export const ContactsDataTable: React.FC<ContactsDataTableProps> = ({
  contacts,
  selectedContactIds,
  onToggleSelectAll,
  onToggleSelect,
  sortConfig,
  onSort,
  currency,
  contactSettings,
  isLoading,
  isError,
  error,
  onRetry,
  onEditContact,
  onDeleteContact,
  onClearFilters,
  hasActiveFilters,
  onAddContact,
}) => {
  const isAllSelected =
    contacts.length > 0 && contacts.every((c) => selectedContactIds.includes(c.id));

  const columns = useMemo<CRMDataTableColumn<ContactItem>[]>(() => {
    return [
      // 1. Row Selection
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
              aria-label="Select all contacts on this page"
            />
          </div>
        ),
        cell: (contact) => {
          const isSelected = selectedContactIds.includes(contact.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect(contact.id, Boolean(checked))}
                aria-label={`Select contact ${contact.name || "unnamed"}`}
              />
            </div>
          );
        },
        className: "w-12 px-3 text-center",
        headerClassName: "w-12 px-3 text-center",
        align: "center",
      },

      // 2. Contact Name & Company
      {
        header: "Contact",
        sortable: true,
        sortDirection: sortConfig?.key === "name" ? sortConfig.direction : null,
        onSort: (dir) => onSort("name", dir),
        cell: (contact) => {
          const color = getOrgAvatarColor(contact.name || "Contact");
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {contact.name ? contact.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  onClick={() => onEditContact(contact)}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                  title={contact.name || "Unnamed Contact"}
                >
                  {contact.name || "Unnamed Contact"}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={contact.company || ""}>
                  {contact.company || "No Company"}
                </p>
              </div>
            </div>
          );
        },
        className: "min-w-[200px] max-w-[280px]",
      },

      // 3. Type Badge
      {
        header: "Type",
        sortable: true,
        sortDirection: sortConfig?.key === "type" ? sortConfig.direction : null,
        onSort: (dir) => onSort("type", dir),
        cell: (contact) => (
          <Badge
            variant={contact.type === "Customer" ? "info" : "secondary"}
            className="font-bold text-[10px] tracking-wider"
          >
            {contact.type}
          </Badge>
        ),
        className: "w-28",
      },

      // 4. Status
      {
        header: "Status",
        cell: (contact) => {
          // Status badge mapping
          let statusVariant: "slate" | "emerald" | "indigo" | "neutral" | "rose" | "amber" | "blue" = "slate";
          if (contact.type === "Customer") {
            statusVariant =
              contact.status === "ACTIVE"
                ? "emerald"
                : contact.status === "PREMIUM"
                ? "indigo"
                : "neutral";
          } else {
            const s = (contact.status || contact.stage || "").toLowerCase();
            if (s.includes("won")) statusVariant = "emerald";
            else if (s.includes("lost")) statusVariant = "rose";
            else if (s.includes("proposal")) statusVariant = "indigo";
            else if (s.includes("contacted")) statusVariant = "amber";
            else if (s.includes("new")) statusVariant = "blue";
          }

          const resolvedStatus =
            contact.type === "Customer"
              ? contact.status || "ACTIVE"
              : contact.status || contact.stage || "NEW";

          return <StatusBadge status={resolvedStatus} variant={statusVariant} />;
        },
        className: "w-32",
      },

      // 5. Contact Info
      {
        header: "Contact Info",
        cell: (contact) => (
          <div className="flex flex-col gap-1 min-w-0">
            {contact.email ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{contact.email}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-[11px]">—</span>
            )}
            {contactSettings.showPhone !== false && contact.phone && (
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground truncate">
                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{contact.phone}</span>
              </span>
            )}
          </div>
        ),
        className: "min-w-[180px]",
      },

      // 6. Revenue
      {
        header: "Revenue",
        sortable: true,
        sortDirection: sortConfig?.key === "revenue" ? sortConfig.direction : null,
        onSort: (dir) => onSort("revenue", dir),
        cell: (contact) => {
          const revenueVal = contact.valueAmount ?? contact.revenueValue ?? 0;
          return (
            <span className="font-bold text-foreground">
              {revenueVal > 0 ? formatCurrency(revenueVal, currency) : "—"}
            </span>
          );
        },
        className: "w-32",
      },

      // 7. Created Date
      {
        header: "Created Date",
        sortable: true,
        sortDirection: sortConfig?.key === "date" ? sortConfig.direction : null,
        onSort: (dir) => onSort("date", dir),
        cell: (contact) => {
          const rawDate = (contact.createdAt as string) || (contact.lastContact as string);
          return (
            <div>
              <p className="text-xs font-semibold text-foreground">
                {formatDate(rawDate, "—")}
              </p>
            </div>
          );
        },
        className: "w-36",
      },

      // 8. Actions
      {
        header: <span className="sr-only">Actions</span>,
        cell: (contact) => {
          const actionItems: CRMActionMenuItemConfig[] = [
            {
              label: `Edit ${contact.type}`,
              icon: Edit,
              onClick: () => onEditContact(contact),
            },
            ...(contact.email
              ? [
                  {
                    label: "Send Email",
                    icon: Mail,
                    onClick: () => window.open(`mailto:${contact.email}`),
                  },
                ]
              : []),
            {
              label: `Delete ${contact.type}`,
              icon: Trash2,
              variant: "destructive" as const,
              separatorBefore: true,
              onClick: () => onDeleteContact(contact),
            },
          ];

          return (
            <CRMActionMenu
              items={actionItems}
              aria-label={`Actions for ${contact.name || "contact"}`}
              triggerTooltip="Contact actions"
            />
          );
        },
        className: "w-16 text-right",
        headerClassName: "w-16 text-right",
        align: "right",
      },
    ];
  }, [
    isAllSelected,
    selectedContactIds,
    onToggleSelectAll,
    onToggleSelect,
    sortConfig,
    onSort,
    currency,
    contactSettings,
    onEditContact,
    onDeleteContact,
  ]);

  return (
    <CRMDataTable<ContactItem>
      data={contacts}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={onRetry}
      emptyMessage={
        <EmptyState
          icon={Users}
          title="No contacts found"
          description={
            hasActiveFilters
              ? "No contacts match your current search or filter criteria."
              : "Get started by adding your first lead or customer."
          }
          className="border-none bg-transparent shadow-none p-6 min-h-0"
          action={
            hasActiveFilters
              ? {
                  label: "Clear Filters",
                  onClick: onClearFilters,
                  icon: RotateCcw,
                }
              : {
                  label: "Add Contact",
                  onClick: onAddContact,
                  icon: UserPlus,
                }
          }
        />
      }
      hasPagination={false}
      rowClassName={(contact) =>
        cn(
          "transition-colors",
          selectedContactIds.includes(contact.id) && "bg-primary/[0.04]"
        )
      }
    />
  );
};
