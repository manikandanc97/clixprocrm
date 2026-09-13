"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Edit, Loader2 } from "lucide-react";
import { TicketItem, CATEGORIES, PRIORITY_CONFIG } from "./ticket-history.types";

interface TicketEditModalProps {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  activeEditTicket: TicketItem | null;
  editSubject: string;
  setEditSubject: (val: string) => void;
  editCategory: string;
  setEditCategory: (val: string) => void;
  editPriority: "Low" | "Medium" | "High" | "Critical";
  setEditPriority: (val: "Low" | "Medium" | "High" | "Critical") => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  isSavingEdit: boolean;
  isEditDirty: boolean;
  onSaveEdit: () => void;
  onCancel: () => void;
}

export function TicketEditModal({
  isEditDialogOpen,
  setIsEditDialogOpen,
  activeEditTicket,
  editSubject,
  setEditSubject,
  editCategory,
  setEditCategory,
  editPriority,
  setEditPriority,
  editDescription,
  setEditDescription,
  isSavingEdit,
  isEditDirty,
  onSaveEdit,
  onCancel,
}: TicketEditModalProps) {
  return (
    <Dialog
      open={isEditDialogOpen}
      onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-lg p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <AppIcon name="edit" icon={Edit} size={16} className="text-primary" />
            Edit Ticket #{activeEditTicket?.ticketId}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update the subject, category, priority, or problem description for this ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Subject *</Label>
            <Input
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              placeholder="Brief summary of the issue..."
              className="text-xs h-9"
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="text-xs h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Priority</Label>
              <Select
                value={editPriority}
                onValueChange={(val) => setEditPriority(val as "Low" | "Medium" | "High" | "Critical")}
              >
                <SelectTrigger className="text-xs h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{cfg.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Description *</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="text-xs min-h-[110px] resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSavingEdit}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSaveEdit}
            disabled={isSavingEdit || !isEditDirty || !editSubject.trim() || !editDescription.trim()}
            className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
          >
            {isSavingEdit ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
