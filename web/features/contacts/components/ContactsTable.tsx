"use client";

import {
  MoreVertical,
  Mail,
  User,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { Checkbox } from "@/shared/ui/checkbox";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { CRMPagination } from "@/shared/components/crm";
import { useState } from "react";
import { formatCurrency } from "@/lib/crm-formatters";
import { useCurrency } from "@/shared/hooks/use-currency";
import { cn } from "@/shared/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ContactsTable = ({ contacts, onEditLead, onEditCustomer, onDeleteLead, onDeleteCustomer }: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { currency } = useCurrency();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedIds(contacts.map((c: any) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sort state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedContacts: any[] = sortConfig
    ? [...contacts].sort((a: any, b: any) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : contacts;

  const columns = [
    {
      header: (
        <Checkbox
          checked={selectedIds.length === contacts.length && contacts.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => (
        <Checkbox
          checked={selectedIds.includes(contact.id)}
          onCheckedChange={() => handleSelect(contact.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Contact",
      sortable: true,
      sortDirection: sortConfig?.key === "name" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("name", dir),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl border border-border">
            <AvatarFallback className="font-bold text-[10px] bg-primary/5 text-primary">
              {contact.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span
              onClick={() => {
                if (contact.type === "Lead") onEditLead?.(contact.raw);
                else onEditCustomer?.(contact.raw);
              }}
              className="text-sm font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors cursor-pointer"
            >
              {contact.name}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {contact.company}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => (
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
            contact.type === "Customer"
              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          )}
        >
          {contact.type}
        </span>
      ),
    },
    {
      header: "Status",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let variant: any = "slate";
        if (contact.type === "Customer") {
          variant = contact.status === "ACTIVE" ? "emerald" : contact.status === "PREMIUM" ? "indigo" : "neutral";
        } else {
          const s = (contact.status || contact.stage || "").toLowerCase();
          if (s.includes("new")) variant = "blue";
          else if (s.includes("contacted")) variant = "amber";
          else if (s.includes("proposal")) variant = "indigo";
          else if (s.includes("won")) variant = "emerald";
          else if (s.includes("lost")) variant = "rose";
        }
        return (
          <StatusBadge
            status={contact.type === "Customer" ? contact.status : (contact.status || contact.stage)}
            variant={variant}
          />
        );
      },
    },
    {
      header: "Contact Info",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Mail className="w-3 h-3" /> {contact.email || "—"}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Phone className="w-3 h-3" /> {contact.phone || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Value / Revenue",
      align: "right" as const,
      sortable: true,
      sortDirection: sortConfig?.key === "valueAmount" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("valueAmount", dir),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => {
        const val = contact.valueAmount ?? contact.revenueValue ?? 0;
        return (
          <span className="text-sm font-bold text-foreground">
            {val > 0 ? formatCurrency(val, currency) : "—"}
          </span>
        );
      },
    },
    {
      header: "Last Activity",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => {
        const dateStr = contact.lastActivity || contact.lastContact || contact.updatedAt || contact.createdAt;
        let formattedDate = "—";
        if (dateStr) {
          try {
            formattedDate = new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(dateStr));
          } catch {}
        }
        return <span className="text-xs text-muted-foreground">{formattedDate}</span>;
      },
    },
    {
      header: "Actions",
      align: "right" as const,
      headerClassName: "text-right",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (contact: any) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  if (contact.type === "Lead") onEditLead?.(contact.raw);
                  else onEditCustomer?.(contact.raw);
                }}
              >
                <AppIcon name="edit" size={14} className="mr-2" /> Edit {contact.type}
              </DropdownMenuItem>
              {contact.email && (
                <DropdownMenuItem
                  onClick={() => window.open(`mailto:${contact.email}`)}
                >
                  <AppIcon name="mail" size={14} className="mr-2" /> Send Email
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete this ${contact.type.toLowerCase()}?`)) {
                    if (contact.type === "Lead") onDeleteLead?.(contact.raw.id);
                    else onDeleteCustomer?.(contact.raw.id);
                  }
                }}
              >
                <AppIcon name="trash" size={14} className="mr-2 text-rose-600" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "text-right",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedContacts.length / rowsPerPage) || 1;
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-auto flex flex-col min-h-0 relative gap-3.5 sm:gap-4">
      <div className="flex flex-col min-h-0 flex-1">
        <DataTable
          data={paginatedContacts}
          columns={columns}
          rowClassName="h-16 hover:bg-muted/30 transition-colors"
          emptyTitle="No contacts found"
          emptyDescription="No contacts match the current search or filters."
          hasPagination={sortedContacts.length > 0}
        />
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedContacts.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        itemName="Contacts"
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};
