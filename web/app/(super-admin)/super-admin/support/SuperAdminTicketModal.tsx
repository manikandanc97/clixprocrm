"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  fetchPlatformSupportTicketDetails,
  updatePlatformSupportTicketStatus,
  assignPlatformSupportTicket,
  updatePlatformSupportTicket,
  replyPlatformSupportTicket,
  deletePlatformSupportTicket,
  PlatformSupportTicket,
} from "@/shared/lib/api/super-admin.api";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/features/help-center/components/ticket-shared";
import { TicketModalHeader } from "./components/ticket-modal/TicketModalHeader";
import { TicketConversationPanel } from "./components/ticket-modal/TicketConversationPanel";
import { TicketModalSidebar } from "./components/ticket-modal/TicketModalSidebar";
import { TicketMediaPreviewModal } from "./components/ticket-modal/TicketMediaPreviewModal";
import { TicketDeleteDialog } from "./components/ticket-modal/TicketDeleteDialog";
import { MediaPreviewItem } from "./components/ticket-modal/ticket-modal-types";

export interface SuperAdminTicketModalProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: () => void;
}

export function SuperAdminTicketModal({
  ticketId,
  open,
  onOpenChange,
  onTicketUpdated,
}: SuperAdminTicketModalProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<PlatformSupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline Subject Editing
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  // Field Saving States
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Reply Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Media Lightbox Preview
  const [previewMedia, setPreviewMedia] = useState<MediaPreviewItem | null>(null);

  // Load Ticket Data
  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await fetchPlatformSupportTicketDetails(ticketId);
      setTicket(data);
      setSubjectDraft(data.subject);
    } catch (err: unknown) {
      console.error("Failed to load ticket:", err);
      toast.error("Could not load support ticket details.");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [ticketId, onOpenChange]);

  // Adjust ticket to null during render when closed or ticketId changes
  const [prevTicketSession, setPrevTicketSession] = useState(open ? ticketId : null);
  const currentTicketSession = open ? ticketId : null;
  if (currentTicketSession !== prevTicketSession) {
    setPrevTicketSession(currentTicketSession);
    if (!currentTicketSession) {
      setTicket(null);
    }
  }

  useEffect(() => {
    if (!open || !ticketId) return;
    let active = true;
    fetchPlatformSupportTicketDetails(ticketId)
      .then((data) => {
        if (!active) return;
        setTicket(data);
        setSubjectDraft(data.subject);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Failed to load ticket:", err);
        toast.error("Could not load support ticket details.");
        onOpenChange(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, ticketId, onOpenChange]);

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied ticket #${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Inline Subject Save
  const handleSaveSubject = async () => {
    if (!ticket || !subjectDraft.trim() || subjectDraft.trim() === ticket.subject) {
      setIsEditingSubject(false);
      return;
    }
    try {
      setSavingSubject(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        subject: subjectDraft.trim(),
      });
      setTicket(updated);
      setIsEditingSubject(false);
      toast.success("Subject updated successfully");
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to update subject:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update subject";
      toast.error(msg);
    } finally {
      setSavingSubject(false);
    }
  };

  // Inline Status Change
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || ticket.status === newStatus) return;
    try {
      setSavingStatus(true);
      const updated = await updatePlatformSupportTicketStatus(ticket.id, newStatus);
      setTicket(updated);
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to update status:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update status";
      toast.error(msg);
    } finally {
      setSavingStatus(false);
    }
  };

  // Inline Priority Change
  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket || ticket.priority === newPriority) return;
    try {
      setSavingPriority(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        priority: newPriority,
      });
      setTicket(updated);
      toast.success(`Priority updated to ${PRIORITY_CONFIG[newPriority]?.label || newPriority}`);
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to update priority:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update priority";
      toast.error(msg);
    } finally {
      setSavingPriority(false);
    }
  };

  // Inline Assignee Change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket) return;
    const targetId = newAssigneeId === "unassigned" ? null : newAssigneeId;
    if (ticket.assignedToId === targetId) return;
    try {
      setSavingAssignee(true);
      const updated = await assignPlatformSupportTicket(ticket.id, targetId);
      setTicket(updated);
      toast.success(targetId ? "Ticket assigned successfully" : "Ticket unassigned");
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to assign ticket:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to assign ticket";
      toast.error(msg);
    } finally {
      setSavingAssignee(false);
    }
  };

  // Inline Category Change
  const handleCategoryChange = async (newCategory: string) => {
    if (!ticket || ticket.category === newCategory) return;
    try {
      setSavingCategory(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        category: newCategory,
      });
      setTicket(updated);
      toast.success(`Category updated to ${newCategory}`);
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to update category:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update category";
      toast.error(msg);
    } finally {
      setSavingCategory(false);
    }
  };

  // Send Reply or Internal Note
  const handleSendReply = async () => {
    if (!ticket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const updated = await replyPlatformSupportTicket(
        ticket.id,
        replyText.trim(),
        isInternalNote
      );
      setTicket(updated);
      setReplyText("");
      toast.success(
        isInternalNote ? "Internal staff note recorded" : "Reply sent to customer"
      );
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to send reply:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to send response";
      toast.error(msg);
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async () => {
    if (!ticket) return;
    try {
      setDeletingTicket(true);
      await deletePlatformSupportTicket(ticket.id);
      toast.success(`Ticket #${ticket.ticketNumber} permanently deleted`);
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      onTicketUpdated?.();
    } catch (err: unknown) {
      console.error("Failed to delete ticket:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to delete ticket";
      toast.error(msg);
    } finally {
      setDeletingTicket(false);
    }
  };

  // Deduplicate follow-up messages from initial ticket description
  const followUpMessages = (ticket?.messages || []).filter(
    (m) => m.message?.trim() !== ticket?.description?.trim()
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl w-full h-[90vh] max-h-[850px] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border shadow-2xl bg-card"
        >
          <DialogDescription className="sr-only">
            Platform support ticket management, conversation thread, triage settings, and diagnostics.
          </DialogDescription>

          {loading || !ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">Loading ticket details...</p>
            </div>
          ) : (
            <>
              {/* Sticky Top Header */}
              <TicketModalHeader
                ticket={ticket}
                loading={loading}
                copiedId={copiedId}
                onCopyId={copyId}
                onRefresh={loadTicket}
                onOpenDelete={() => setIsDeleteDialogOpen(true)}
                onClose={() => onOpenChange(false)}
                isEditingSubject={isEditingSubject}
                setIsEditingSubject={setIsEditingSubject}
                subjectDraft={subjectDraft}
                setSubjectDraft={setSubjectDraft}
                savingSubject={savingSubject}
                onSaveSubject={handleSaveSubject}
              />

              {/* Scrollable Modal Body: 2 Columns */}
              <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Timeline & Discussion (8 cols) */}
                  <TicketConversationPanel
                    ticket={ticket}
                    followUpMessages={followUpMessages}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    isInternalNote={isInternalNote}
                    setIsInternalNote={setIsInternalNote}
                    sendingReply={sendingReply}
                    onSendReply={handleSendReply}
                    onPreviewMedia={setPreviewMedia}
                  />

                  {/* Right Column: Triage Controls & Workspace Info (4 cols) */}
                  <TicketModalSidebar
                    ticket={ticket}
                    currentUserId={user?.id}
                    currentUserName={user?.name}
                    savingStatus={savingStatus}
                    onStatusChange={handleStatusChange}
                    savingPriority={savingPriority}
                    onPriorityChange={handlePriorityChange}
                    savingAssignee={savingAssignee}
                    onAssigneeChange={handleAssigneeChange}
                    savingCategory={savingCategory}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
              </div>

              {/* In-Modal Media Preview Overlay */}
              <TicketMediaPreviewModal
                previewMedia={previewMedia}
                onClose={() => setPreviewMedia(null)}
              />

              {/* In-Modal Delete Confirmation Overlay */}
              <TicketDeleteDialog
                ticket={ticket}
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirmDelete={handleDeleteTicket}
                deleting={deletingTicket}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
