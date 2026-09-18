"use client";

import { ShieldAlert } from "lucide-react";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

interface ModuleDeleteDialogProps {
  moduleToDelete: PlatformModule | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function ModuleDeleteDialog({
  moduleToDelete,
  onClose,
  onConfirm,
  deleting,
}: ModuleDeleteDialogProps) {
  return (
    <CRMDeleteDialog
      mode="single"
      isOpen={Boolean(moduleToDelete)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      itemName="Menu"
      title={
        moduleToDelete?.isSystem
          ? "Protected System Menu"
          : "Delete Navigation Menu"
      }
      description={
        moduleToDelete?.isSystem
          ? "System menus provide core CRM workflows and cannot be deleted."
          : `Are you sure you want to delete "${moduleToDelete?.label}"?`
      }
      hideConfirm={moduleToDelete?.isSystem}
      mediaClassName={
        moduleToDelete?.isSystem ? "bg-amber-500/10 text-amber-600" : undefined
      }
      icon={
        moduleToDelete?.isSystem ? <ShieldAlert className="w-5 h-5" /> : undefined
      }
      onConfirm={onConfirm}
      isDeleting={deleting}
      confirmLabel="Delete Menu"
    >
      {moduleToDelete?.isSystem ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5 mt-2">
          <p className="font-semibold">
            Cannot delete core module &quot;{moduleToDelete?.label}&quot;
          </p>
          <p className="text-[11px] leading-relaxed opacity-90">
            Instead of deleting, you can switch <strong>Status</strong> to Inactive to disable it and remove it from sidebar navigation.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          This will permanently remove <strong>&quot;{moduleToDelete?.label}&quot;</strong> (
          <code>{moduleToDelete?.route}</code>) from navigation. This action cannot be
          undone.
        </p>
      )}
    </CRMDeleteDialog>
  );
}
