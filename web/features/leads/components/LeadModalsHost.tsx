"use client";

import React from "react";
import { FormModal } from "@/shared/components/crm/FormModal";
import { LeadForm } from "@/features/forms/LeadForm";
import { TaskForm } from "@/features/forms/TaskForm";
import { CustomerForm } from "@/features/forms/CustomerForm";
import { MeetingForm } from "@/features/forms/MeetingForm";
import { StageTransitionModal } from "./StageTransitionModal";
import { ConfirmMoveModal } from "@/features/pipeline/components/ConfirmMoveModal";
import { WonLostModal } from "@/features/pipeline/components/WonLostModal";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { AddNoteModal } from "./AddNoteModal";
import { LeadDetailsDrawer } from "./LeadDetailsDrawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { RefreshCw } from "lucide-react";
import { LeadType, LeadStatus } from "@/shared/types/lead";
import { WonLostSubmitData } from "@/features/pipeline/components/WonLostModal";
import { updateLead } from "@/shared/lib/api/crm";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LeadModalsHostProps {
  editingLead: LeadType | null;
  setEditingLead: (lead: LeadType | null) => void;
  taskLead: LeadType | null;
  setTaskLead: (lead: LeadType | null) => void;
  meetingLead: LeadType | null;
  setMeetingLead: (lead: LeadType | null) => void;
  customerLead: LeadType | null;
  setCustomerLead: (lead: LeadType | null) => void;
  stageTransitionLead: LeadType | null;
  setStageTransitionLead: (lead: LeadType | null) => void;
  confirmMoveModal: { isOpen: boolean; deal: any; targetStage: string | null; originalStage?: string | null };
  setConfirmMoveModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; deal: any; targetStage: string | null; originalStage: string | null }>>;
  wonLostModal: { isOpen: boolean; type: "WON" | "LOST" | null; deal: any; originalStage?: string | null };
  setWonLostModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; type: any; deal: any; originalStage: string | null }>>;
  isUpdating: boolean;
  deletingLead: LeadType | null;
  setDeletingLead: (lead: LeadType | null) => void;
  isBulkDeleting: boolean;
  setIsBulkDeleting: (open: boolean) => void;
  isDeletingBulk: boolean;
  selectedIds: string[];
  addNoteLead: string | null;
  setAddNoteLead: (id: string | null) => void;
  detailsLeadId: string | null;
  setDetailsLeadId: (id: string | null) => void;
  convertLead: LeadType | null;
  setConvertLead: (lead: LeadType | null) => void;
  handleStageChange: (lead: LeadType, targetStage: any) => void;
  handleConfirmMoveSubmit: () => void;
  handleWonLostSubmit: (data: WonLostSubmitData) => void;
  handleDelete: (id: string, name: string) => void;
  handleBulkDelete: (ids: string[]) => Promise<void>;
}

export function LeadModalsHost({
  editingLead,
  setEditingLead,
  taskLead,
  setTaskLead,
  meetingLead,
  setMeetingLead,
  customerLead,
  setCustomerLead,
  stageTransitionLead,
  setStageTransitionLead,
  confirmMoveModal,
  setConfirmMoveModal,
  wonLostModal,
  setWonLostModal,
  isUpdating,
  deletingLead,
  setDeletingLead,
  isBulkDeleting,
  setIsBulkDeleting,
  isDeletingBulk,
  selectedIds,
  addNoteLead,
  setAddNoteLead,
  detailsLeadId,
  setDetailsLeadId,
  convertLead,
  setConvertLead,
  handleStageChange,
  handleConfirmMoveSubmit,
  handleWonLostSubmit,
  handleDelete,
  handleBulkDelete,
}: LeadModalsHostProps) {
  const queryClient = useQueryClient();

  return (
    <>
      <FormModal
        title="Edit Lead"
        description="Update the details of this lead."
        isOpen={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        size="lg"
      >
        {editingLead && (
          <LeadForm
            initialData={editingLead}
            onSuccess={() => setEditingLead(null)}
            onCancel={() => setEditingLead(null)}
          />
        )}
      </FormModal>

      <FormModal
        title="Create Task"
        description={`Create a new task for ${taskLead?.name}.`}
        isOpen={!!taskLead}
        onOpenChange={(open) => !open && setTaskLead(null)}
        size="md"
      >
        {taskLead && (
          <TaskForm
            onSuccess={() => setTaskLead(null)}
            onCancel={() => setTaskLead(null)}
          />
        )}
      </FormModal>

      <FormModal
        title="Meeting"
        description={`Schedule or log a meeting with ${meetingLead?.name}.`}
        isOpen={!!meetingLead}
        onOpenChange={(open) => !open && setMeetingLead(null)}
        size="md"
      >
        {meetingLead && (
          <MeetingForm
            defaultLeadId={meetingLead.id}
            onSuccess={() => setMeetingLead(null)}
            onCancel={() => setMeetingLead(null)}
          />
        )}
      </FormModal>

      <FormModal
        title="Convert to Customer"
        description={`Convert ${customerLead?.name} to a customer.`}
        isOpen={!!customerLead}
        onOpenChange={(open) => !open && setCustomerLead(null)}
        size="lg"
      >
        {customerLead && (
          <CustomerForm
            initialData={{
              name: customerLead.name,
              company: customerLead.company,
              email: customerLead.email,
              status: "ACTIVE",
              revenueValue: customerLead.valueAmount || 0,
              createdAt: customerLead.createdAt,
              updatedAt: customerLead.updatedAt,
            } as any}
            onSuccess={async () => {
              try {
                await updateLead(customerLead.id, { stage: LeadStatus.WON });
                queryClient.invalidateQueries({ queryKey: ["leads"] });
                queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
                toast.success(`${customerLead.name} has been marked as Won.`);
              } catch {
                toast.error("Failed to update lead status to Won.");
              }
              setCustomerLead(null);
            }}
            onCancel={() => setCustomerLead(null)}
          />
        )}
      </FormModal>

      <StageTransitionModal
        isOpen={!!stageTransitionLead}
        onClose={() => setStageTransitionLead(null)}
        lead={stageTransitionLead}
        onSelectTargetStage={(lead, targetStage) => {
          setStageTransitionLead(null);
          setTimeout(() => handleStageChange(stageTransitionLead!, targetStage), 150);
        }}
      />

      <ConfirmMoveModal
        isOpen={confirmMoveModal.isOpen}
        deal={confirmMoveModal.deal}
        targetStage={confirmMoveModal.targetStage}
        onClose={() => setConfirmMoveModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleConfirmMoveSubmit}
        isLoading={isUpdating}
      />

      <WonLostModal
        isOpen={wonLostModal.isOpen}
        type={wonLostModal.type}
        deal={wonLostModal.deal}
        onClose={() => setWonLostModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleWonLostSubmit}
        isLoading={isUpdating}
      />

      <AlertDialog open={!!deletingLead} onOpenChange={(open) => !open && setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead <strong>{deletingLead?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingLead) {
                  handleDelete(deletingLead.id, deletingLead.name);
                  setDeletingLead(null);
                }
              }}
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={(open) => !isDeletingBulk && setIsBulkDeleting(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Leads?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedIds.length} selected leads? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBulk}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                await handleBulkDelete(selectedIds);
                setIsBulkDeleting(false);
              }}
              disabled={isDeletingBulk}
            >
              {isDeletingBulk ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Leads"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddNoteModal
        isOpen={!!addNoteLead}
        onOpenChange={(open) => !open && setAddNoteLead(null)}
        leadId={addNoteLead}
      />

      <LeadDetailsDrawer
        isOpen={!!detailsLeadId}
        onOpenChange={(open) => !open && setDetailsLeadId(null)}
        leadId={detailsLeadId}
      />

      <ConvertLeadModal
        isOpen={!!convertLead}
        onClose={() => setConvertLead(null)}
        lead={convertLead}
      />
    </>
  );
}
