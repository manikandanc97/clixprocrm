"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CRMPagination } from "@/shared/components/crm";
import { toast } from "sonner";
import client from "@/shared/lib/api/client";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  TicketItem,
} from "./ticket-history/ticket-history.types";
import { TicketMediaPreviewDialog, PreviewMediaData } from "./ticket-history/TicketMediaPreviewDialog";
import { TicketDeleteDialog } from "./ticket-history/TicketDeleteDialog";
import { TicketEditModal } from "./ticket-history/TicketEditModal";
import { TicketDetailsModal } from "./ticket-history/TicketDetailsModal";
import { TicketHistoryToolbar } from "./ticket-history/TicketHistoryToolbar";
import { TicketHistoryTable } from "./ticket-history/TicketHistoryTable";

export type { TicketItem };

interface TicketHistoryListProps {
  onNewTicketClick?: () => void;
}

export function TicketHistoryList({ onNewTicketClick }: TicketHistoryListProps) {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Selection & Pagination & Sorting
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt";
    direction: "asc" | "desc";
  } | null>(null);

  const setSort = (key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Ticket modal details state
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit ticket state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete ticket state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Target ticket for Edit / Delete operations
  const [targetTicket, setTargetTicket] = useState<TicketItem | null>(null);

  // Attachment media preview lightbox state
  const [previewMedia, setPreviewMedia] = useState<PreviewMediaData | null>(null);

  const handleSelectTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    try {
      const res = await client.get(`/support/tickets/${ticket.ticketId || ticket.id}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === res.data.data.ticketId ? res.data.data : t))
        );
      }
    } catch {
      // Keep cached ticket state
    }
  };

  useEffect(() => {
    let active = true;
    client.get("/support/tickets")
      .then((res) => {
        if (!active) return;
        setTickets(res.data?.data || []);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load tickets:", error);
        toast.error("Could not fetch support tickets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const [prevFilterKey, setPrevFilterKey] = useState(
    `${searchTerm}::${statusFilter}::${priorityFilter}::${categoryFilter}`
  );

  const currentFilterKey = `${searchTerm}::${statusFilter}::${priorityFilter}::${categoryFilter}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const isSuperAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.role === "SUPER_ADMIN" ||
      user?.role === "SUPERADMIN"
  );
  const isOrgAdmin = Boolean(
    user?.role === "ADMIN" ||
      user?.role === "OWNER" ||
      user?.role === "ORG_OWNER"
  );

  const isCreator = (ticket?: TicketItem | null): boolean => {
    if (!ticket) return false;
    if (isSuperAdmin || isOrgAdmin) return true;
    const currentUserId = user?.id;
    const currentUserEmail = user?.email?.toLowerCase();
    return Boolean(
      (ticket.userId && currentUserId && ticket.userId === currentUserId) ||
      (ticket.userEmail && currentUserEmail && ticket.userEmail.toLowerCase() === currentUserEmail)
    );
  };

  const canManageTicket = (ticket: TicketItem) => {
    return isCreator(ticket);
  };

  const activeEditTicket = targetTicket || selectedTicket;
  const isEditDirty = useMemo(() => {
    if (!activeEditTicket) return false;
    return (
      editSubject !== activeEditTicket.subject ||
      editCategory !== (activeEditTicket.category || "General Inquiry") ||
      editPriority !== (activeEditTicket.priority || "Medium") ||
      editDescription !== (activeEditTicket.description || "")
    );
  }, [activeEditTicket, editSubject, editCategory, editPriority, editDescription]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setIsReplying(true);
      const res = await client.post(`/support/tickets/${selectedTicket.ticketId || selectedTicket.id}/reply`, {
        message: replyText.trim(),
      });
      const updatedTicket = res.data?.data;
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
        );
      }
      setReplyText("");
      toast.success("Reply added to ticket thread.");
    } catch (error: unknown) {
      console.error("Reply failed:", error);
      const errRes = error as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(errRes?.response?.data?.error?.message || errRes?.response?.data?.message || "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleOpenEdit = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTicket(null);
    setTargetTicket(ticket);
    setEditSubject(ticket.subject);
    setEditCategory(ticket.category || "General Inquiry");
    setEditPriority(ticket.priority || "Medium");
    setEditDescription(ticket.description || "");
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTicket(null);
    setTargetTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const activeTarget = targetTicket || selectedTicket;
    if (!activeTarget) return;
    if (!editSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!editDescription.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await client.patch(`/support/tickets/${activeTarget.ticketId || activeTarget.id}`, {
        subject: editSubject.trim(),
        category: editCategory,
        priority: editPriority,
        description: editDescription.trim(),
      });

      const updatedTicket = res.data?.data;
      if (updatedTicket) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === updatedTicket.id || t.ticketId === updatedTicket.ticketId ? updatedTicket : t
          )
        );
      }
      setIsEditDialogOpen(false);
      setTargetTicket(null);
      toast.success("Ticket updated successfully!");
    } catch (err: unknown) {
      console.error("Failed to update ticket:", err);
      const errRes = err as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(
        errRes?.response?.data?.error?.message ||
        errRes?.response?.data?.message ||
        "Failed to update ticket details."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTicket = async () => {
    const activeTarget = targetTicket || selectedTicket;
    if (!activeTarget) return;

    try {
      setIsDeleting(true);
      await client.delete(`/support/tickets/${activeTarget.ticketId || activeTarget.id}`);
      setTickets((prev) =>
        prev.filter((t) => t.id !== activeTarget.id && t.ticketId !== activeTarget.ticketId)
      );
      setSelectedTicketIds((prev) =>
        prev.filter((id) => id !== activeTarget.id && id !== activeTarget.ticketId)
      );
      setSelectedTicket(null);
      setIsDeleteDialogOpen(false);
      const deletedNumber = activeTarget.ticketId;
      setTargetTicket(null);
      toast.success(`Ticket #${deletedNumber} deleted successfully.`);
    } catch (err: unknown) {
      console.error("Failed to delete ticket:", err);
      const errRes = err as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(
        errRes?.response?.data?.error?.message ||
        errRes?.response?.data?.message ||
        "Failed to delete ticket."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteTickets = async () => {
    if (selectedTicketIds.length === 0) return;

    try {
      setIsBulkDeleting(true);
      for (const id of selectedTicketIds) {
        try {
          await client.delete(`/support/tickets/${id}`);
        } catch (err) {
          console.error(`Failed to delete ticket ${id}`, err);
        }
      }
      setTickets((prev) =>
        prev.filter((t) => !selectedTicketIds.includes(t.id) && !selectedTicketIds.includes(t.ticketId))
      );
      toast.success(`${selectedTicketIds.length} ticket(s) deleted successfully.`);
      setSelectedTicketIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to complete bulk ticket deletion.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Ticket ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    searchTerm.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filtered & Sorted ticket results
  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    if (!sortConfig) return filtered;

    return [...filtered].sort((a: TicketItem, b: TicketItem) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime() as unknown as string;
        bVal = new Date(b.createdAt || 0).getTime() as unknown as string;
      } else {
        aVal = (aVal ?? "").toString().toLowerCase();
        bVal = (bVal ?? "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, sortConfig]);

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No support tickets available to export.");
      return;
    }
    const headers = [
      "Ticket ID",
      "Subject",
      "Requester Name",
      "Requester Email",
      "Category",
      "Priority",
      "Status",
      "Replies Count",
      "Created At",
    ];
    const rows = filteredTickets.map((t) => [
      t.ticketId || t.id,
      `"${(t.subject || "").replace(/"/g, '""')}"`,
      `"${(t.userName || "").replace(/"/g, '""')}"`,
      `"${(t.userEmail || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.priority || "Medium",
      t.status || "OPEN",
      t.replies?.length || 0,
      t.createdAt || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Support tickets exported successfully.");
  };

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage));
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
      {/* 1. Top Controls Toolbar matching Organizations & Companies table */}
      <TicketHistoryToolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCount={selectedTicketIds.length}
        onBulkDeleteClick={() => setIsBulkDeleteDialogOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onExportClick={exportCSV}
        onNewTicketClick={onNewTicketClick}
      />

      {/* 2. Table Content - Vertical & Horizontal Scroll with Sticky Header */}
      <TicketHistoryTable
        loading={loading}
        paginatedTickets={paginatedTickets}
        selectedTicketIds={selectedTicketIds}
        setSelectedTicketIds={setSelectedTicketIds}
        sortConfig={sortConfig}
        setSort={setSort}
        handleSelectTicket={handleSelectTicket}
        canManageTicket={canManageTicket}
        handleOpenEdit={handleOpenEdit}
        handleOpenDelete={handleOpenDelete}
        copyId={copyId}
        copiedId={copiedId}
        hasActiveFilters={hasActiveFilters}
        handleClearFilters={handleClearFilters}
        onNewTicketClick={onNewTicketClick}
      />

      {/* 3. Bottom Pagination */}
      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTickets.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setCurrentPage(1);
        }}
        itemName="Tickets"
      />

      {/* 4. Ticket Details & Discussion Dialog */}
      <TicketDetailsModal
        selectedTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        isCreator={isCreator(selectedTicket)}
        copiedId={copiedId}
        copyId={copyId}
        handleOpenEdit={handleOpenEdit}
        handleOpenDelete={handleOpenDelete}
        setPreviewMedia={setPreviewMedia}
        replyText={replyText}
        setReplyText={setReplyText}
        isReplying={isReplying}
        handleSendReply={handleSendReply}
      />

      {/* 5. Edit Ticket Dialog */}
      <TicketEditModal
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        activeEditTicket={activeEditTicket}
        editSubject={editSubject}
        setEditSubject={setEditSubject}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        isSavingEdit={isSavingEdit}
        isEditDirty={isEditDirty}
        onSaveEdit={handleSaveEdit}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setTargetTicket(null);
        }}
      />

      {/* 6 & 7. Delete Single / Multiple Tickets Confirmation Dialog */}
      <TicketDeleteDialog
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        targetTicket={targetTicket}
        selectedTicket={selectedTicket}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setTargetTicket(null);
        }}
        onConfirmDelete={handleDeleteTicket}
        isDeleting={isDeleting}
        isBulkDeleteDialogOpen={isBulkDeleteDialogOpen}
        setIsBulkDeleteDialogOpen={setIsBulkDeleteDialogOpen}
        selectedTicketCount={selectedTicketIds.length}
        onConfirmBulkDelete={handleBulkDeleteTickets}
        isBulkDeleting={isBulkDeleting}
      />

      {/* 8. Media Preview Lightbox Modal */}
      <TicketMediaPreviewDialog
        previewMedia={previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
      />
    </div>
  );
}
