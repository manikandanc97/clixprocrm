"use client";

import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";

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
    <Dialog
      open={Boolean(moduleToDelete)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[440px] rounded-2xl border-border bg-card shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                moduleToDelete?.isSystem
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {moduleToDelete?.isSystem ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {moduleToDelete?.isSystem ? "Protected System Menu" : "Delete Navigation Menu"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {moduleToDelete?.isSystem
                  ? "System menus provide core CRM workflows and cannot be deleted."
                  : `Are you sure you want to delete "${moduleToDelete?.label}"?`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3">
          {moduleToDelete?.isSystem ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <p className="font-semibold">
                Cannot delete core module &quot;{moduleToDelete?.label}&quot;
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Instead of deleting, you can switch <strong>Status</strong> to Inactive to disable it and remove it from sidebar navigation.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently remove <strong>&quot;{moduleToDelete?.label}&quot;</strong> (
              <code>{moduleToDelete?.route}</code>) from navigation. This action cannot be
              undone.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-medium cursor-pointer"
          >
            Cancel
          </Button>
          {!moduleToDelete?.isSystem && (
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={onConfirm}
              className="text-xs font-semibold cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Menu"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
