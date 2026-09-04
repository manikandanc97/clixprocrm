"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// TasksDeleteDialog
//
// Presentational / orchestration-friendly delete confirmation dialog.
// Mutation logic lives in the parent (tasks/page.tsx).
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

  const confirmLabel = isDeleting
    ? "Deleting\u2026"
    : isSingle
      ? "Delete Task"
      : `Delete ${selectedCount} Task${selectedCount !== 1 ? "s" : ""}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2.5 rounded-lg border border-border/40">
          {warningText}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              // Prevent AlertDialog from auto-closing before onConfirm resolves.
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
