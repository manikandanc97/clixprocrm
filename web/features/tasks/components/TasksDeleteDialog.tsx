"use client";

import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

// ---------------------------------------------------------------------------
// TasksDeleteDialog
//
// Presentational / orchestration-friendly delete confirmation dialog.
// Reuses the canonical CRMDeleteDialog component while preserving the
// existing component interface.
//
// Modes:
//   - mode="single"  → shows the single-task title in the description
//   - mode="bulk"    → shows the selectedCount in the description
// ---------------------------------------------------------------------------

export interface TasksDeleteDialogProps {
  /** Controls dialog visibility. */
  open: boolean;
  /** Called when the dialog requests a visibility change (e.g. Escape / overlay click). */
  onOpenChange: (open: boolean) => void;
  /** "single" for one-task delete, "bulk" for multi-task delete. */
  mode: "single" | "bulk";
  /** Title of the task to delete — used only when mode="single". */
  taskTitle?: string;
  /** Number of selected tasks — used only when mode="bulk". */
  selectedCount?: number;
  /** Called when the user confirms deletion. */
  onConfirm: () => void;
  /** True while the deletion mutation is in-flight. */
  isDeleting: boolean;
}

export function TasksDeleteDialog({
  open,
  onOpenChange,
  mode,
  taskTitle,
  selectedCount = 0,
  onConfirm,
  isDeleting,
}: TasksDeleteDialogProps) {
  const isSingle = mode === "single";

  const title = isSingle ? "Delete Task?" : "Delete Selected Tasks?";

  const description = isSingle
    ? `Are you sure you want to delete "${taskTitle}"?`
    : `You are about to delete ${selectedCount} selected task${selectedCount !== 1 ? "s" : ""}.`;

  const warningText = isSingle
    ? "This action will permanently delete the task and its history. This action cannot be undone."
    : "This action cannot be undone. All selected tasks will be permanently removed.";

  const confirmLabel = isSingle
    ? "Delete Task"
    : `Delete ${selectedCount} Task${selectedCount !== 1 ? "s" : ""}`;

  return (
    <CRMDeleteDialog
      mode={mode}
      isOpen={open}
      onOpenChange={onOpenChange}
      title={title}
      itemName="Task"
      selectedCount={selectedCount}
      description={description}
      warningText={warningText}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
