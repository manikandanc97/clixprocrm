"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  fetchPlatformSupportTickets,
  deletePlatformSupportTicket,
  PlatformSupportTicket,
} from "@/shared/lib/api/super-admin.api";
import { toast } from "sonner";
import { SuperAdminTicketModal } from "./SuperAdminTicketModal";
import { CRMPageContainer, CRMPagination } from "@/shared/components/crm";
import { SupportTableToolbar } from "./components/SupportTableToolbar";
import { SupportTicketsTable } from "./components/SupportTicketsTable";
import {
  DeleteTicketDialog,
  BulkDeleteDialog,
} from "./components/SupportDeleteModals";
import { SupportSortConfig, SupportSortKey } from "./components/support-types";

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters, Sorting & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [sortConfig, setSortConfig] = useState<SupportSortConfig | null>(null);

  const setSort = (key: SupportSortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Delete State
  const [ticketToDelete, setTicketToDelete] = useState<PlatformSupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Selected ticket for modal details view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied ticket #${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const ticketsData = await fetchPlatformSupportTickets({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        search: search.trim() || undefined,
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      });

      setTickets(ticketsData.tickets || []);
      setTotalPages(ticketsData.pagination?.totalPages || 1);
      setTotalCount(ticketsData.pagination?.total || 0);
    } catch (err: unknown) {
      console.error("Failed to load support tickets:", err);
      toast.error("Failed to fetch support tickets from database.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search, currentPage, rowsPerPage, sortConfig]);

  useEffect(() => {
    let active = true;
    fetchPlatformSupportTickets({
      status: statusFilter,
      priority: priorityFilter,
      search: search ? search.trim() : undefined,
      page: currentPage,
      limit: rowsPerPage,
      sortBy: sortConfig?.key,
      sortOrder: sortConfig?.direction,
    })
      .then((ticketsData) => {
        if (!active) return;
        setTickets(ticketsData.tickets || []);
        setTotalPages(ticketsData.pagination?.totalPages || 1);
        setTotalCount(ticketsData.pagination?.total || 0);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Failed to load support tickets:", err);
        toast.error("Failed to fetch support tickets from database.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, priorityFilter, search, currentPage, rowsPerPage, sortConfig]);

  const handleOpenTicket = (ticket: PlatformSupportTicket) => {
    setSelectedTicketId(ticket.id);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      await deletePlatformSupportTicket(ticketToDelete.id);
      setSelectedTicketIds((prev) => prev.filter((id) => id !== ticketToDelete.id));
      setTicketToDelete(null);
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null);
      }
      toast.success(`Ticket #${ticketToDelete.ticketNumber || ticketToDelete.id} deleted successfully.`);
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to delete ticket:", err);
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete ticket.";
      toast.error(msg);
    } finally {
      setDeletingTicket(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(selectedTicketIds.map((id) => deletePlatformSupportTicket(id)));
      toast.success(`${selectedTicketIds.length} ticket(s) deleted permanently.`);
      setSelectedTicketIds([]);
      setBulkDeleteModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to delete selected tickets.";
      toast.error(msg);
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasActiveFilters = statusFilter !== "ALL" || priorityFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No tickets available to export.");
      return;
    }
    const headers = [
      "Ticket #",
      "Subject",
      "Category",
      "Customer Name",
      "Customer Email",
      "Workspace",
      "Priority",
      "Status",
      "Assigned To",
      "Created At",
    ];
    const rows = tickets.map((t) => [
      t.ticketNumber || t.id,
      `"${(t.subject || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      `"${(t.createdBy?.name || "").replace(/"/g, '""')}"`,
      `"${(t.createdBy?.email || "").replace(/"/g, '""')}"`,
      `"${(t.tenant?.name || "").replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      `"${(t.assignedTo?.name || t.assignedTo?.email || "Unassigned").replace(/"/g, '""')}"`,
      t.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Support tickets exported successfully.");
  };

  const handleToggleSelectTicket = (id: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTicketIds(
        Array.from(new Set([...selectedTicketIds, ...tickets.map((t) => t.id)]))
      );
    } else {
      const pageIds = new Set(tickets.map((t) => t.id));
      setSelectedTicketIds(selectedTicketIds.filter((id) => !pageIds.has(id)));
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="support"
              icon={Ticket}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Platform Support Desk & Inbox
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live multi-tenant queue for customer inquiries, escalations, and technical troubleshooting.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <SupportTableToolbar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          search={search}
          setSearch={setSearch}
          selectedCount={selectedTicketIds.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onBulkDelete={() => setBulkDeleteModalOpen(true)}
          onExport={exportCSV}
          onResetPage={() => setCurrentPage(1)}
        />

        <SupportTicketsTable
          tickets={tickets}
          loading={loading}
          selectedTicketIds={selectedTicketIds}
          onToggleSelectTicket={handleToggleSelectTicket}
          onToggleSelectAll={handleToggleSelectAll}
          sortConfig={sortConfig}
          onSort={setSort}
          onOpenTicket={handleOpenTicket}
          onSelectTicketToDelete={(t) => setTicketToDelete(t)}
          copiedId={copiedId}
          onCopyId={copyId}
          formatDate={formatDate}
        />

        {/* Bottom Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Tickets"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTicketDialog
        ticket={ticketToDelete}
        open={!!ticketToDelete}
        onOpenChange={(open) => !open && setTicketToDelete(null)}
        onConfirmDelete={handleDeleteTicket}
        deleting={deletingTicket}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteDialog
        open={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        selectedCount={selectedTicketIds.length}
        onConfirmBulkDelete={handleBulkDelete}
        bulkDeleting={bulkDeleting}
      />

      {/* Super Admin Ticket Details & Triage Modal */}
      <SuperAdminTicketModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        onTicketUpdated={loadData}
      />
    </CRMPageContainer>
  );
}
