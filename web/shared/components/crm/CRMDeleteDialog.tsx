"use client";

import React from "react";
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
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// ---------------------------------------------------------------------------
// Helper: simple pluralizer for common English CRM terms
// ---------------------------------------------------------------------------
function pluralize(word: string): string {
  if (!word) return "";
  const lower = word.toLowerCase();
  if (
    lower.endsWith("y") &&
    !lower.endsWith("ay") &&
    !lower.endsWith("ey") &&
    !lower.endsWith("oy") &&
    !lower.endsWith("uy")
  ) {
    return word.slice(0, -1) + (word[word.length - 1] === "Y" ? "IES" : "ies");
  }
  if (
    lower.endsWith("s") ||
    lower.endsWith("sh") ||
    lower.endsWith("ch") ||
    lower.endsWith("x") ||
    lower.endsWith("z")
  ) {
    return word + (word[word.length - 1] === "S" ? "ES" : "es");
  }
  return word + (word[word.length - 1] === word[word.length - 1].toUpperCase() && word.length > 1 ? "S" : "s");
}

export interface CRMDeleteDialogProps {
  /** "single" for one item, "bulk" for multiple items. Defaults to "single". */
  mode?: "single" | "bulk";
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** State change callback for modal open/close. */
  onOpenChange: (open: boolean) => void;

  /** Custom dialog title. Defaults to standard single/bulk message based on itemName. */
  title?: string;
  /** Name of the entity being deleted (e.g. "Contact", "Company", "Quotation", "Invoice", "User"). Defaults to "Record". */
  itemName?: string;
  /** Number of selected items when mode is "bulk". */
  selectedCount?: number;

  /** Primary description or body text. */
  description?: React.ReactNode;
  /** Warning callout text shown in a styled card inside the dialog. */
  warningText?: React.ReactNode;

  /** Called when the user confirms the destructive action. */
  onConfirm: () => void | Promise<void>;
  /** Whether the deletion operation is currently in-flight. */
  isDeleting?: boolean;

  /** Label for the destructive action button. */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Custom icon displayed inside the media header. Defaults to <Trash2 />. */
  icon?: React.ReactNode;
  /** Optional extra classes for AlertDialogContent. */
  contentClassName?: string;
}

/**
 * CRMDeleteDialog
 *
 * Canonical shared destructive confirmation dialog for CRM entities.
 * Standardizes layout, accessibility, animations, and loading states
 * across all CRM modules.
 */
export function CRMDeleteDialog({
  mode = "single",
  isOpen,
  onOpenChange,
  title,
  itemName = "Record",
  selectedCount = 0,
  description,
  warningText,
  onConfirm,
  isDeleting = false,
  confirmLabel,
  cancelLabel = "Cancel",
  icon,
  contentClassName,
}: CRMDeleteDialogProps) {
  const isSingle = mode === "single";

  // Resolved title
  const resolvedTitle =
    title ??
    (isSingle
      ? `Delete ${itemName}?`
      : `Delete ${selectedCount} Selected ${pluralize(itemName)}?`);

  // Resolved description
  const resolvedDescription =
    description ??
    (isSingle
      ? `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`
      : `You are about to delete ${selectedCount} selected ${pluralize(itemName.toLowerCase())}. This action cannot be undone.`);

  // Resolved button labels
  const defaultConfirmText = isSingle
    ? `Delete ${itemName}`
    : `Delete ${selectedCount} ${pluralize(itemName)}`;

  const resolvedConfirmLabel = isDeleting
    ? "Deleting..."
    : (confirmLabel || defaultConfirmText);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent className={cn("max-w-md p-6", contentClassName)}>
        <AlertDialogHeader className="sm:place-items-start text-left gap-3">
          <div className="flex items-center gap-3 w-full">
            <AlertDialogMedia className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl size-10 shrink-0 mb-0 flex items-center justify-center">
              {icon || <Trash2 className="h-5 w-5" />}
            </AlertDialogMedia>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-base font-bold text-foreground">
                {resolvedTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                {resolvedDescription}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {warningText && (
          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40 my-2">
            {warningText}
          </p>
        )}

        <AlertDialogFooter className="flex-row justify-end gap-2.5 pt-2">
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold h-9 px-4 cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              // Prevent AlertDialog from auto-closing before onConfirm resolves
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="text-xs font-semibold h-9 px-4 cursor-pointer gap-2"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{resolvedConfirmLabel}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
