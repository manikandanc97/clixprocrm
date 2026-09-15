"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanDeleteDialogProps {
  deletingPlan: PlatformPlanItem | null;
  distributionCount: number;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: (plan: PlatformPlanItem) => void;
}

export function PlanDeleteDialog({
  deletingPlan,
  distributionCount,
  deleting,
  onCancel,
  onConfirm,
}: PlanDeleteDialogProps) {
  if (!deletingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Delete Subscription Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete <strong className="text-foreground">{deletingPlan.name}</strong> (<span className="font-mono text-[11px]">{deletingPlan.id}</span>)?
        </p>

        <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-xs text-muted-foreground leading-relaxed">
          {distributionCount > 0 ? (
            <>
              This plan currently has <strong className="text-foreground">{distributionCount} active organization(s)</strong>. Deleting this tier will permanently remove the plan and automatically reassign all subscribed organizations to the <strong className="text-foreground">Free tier</strong>.
            </>
          ) : (
            <>
              This plan has <strong className="text-foreground">0 active workspaces</strong>. All AI entitlements and configuration for this tier will be permanently removed.
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl text-xs font-semibold h-9 px-4"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => onConfirm(deletingPlan)}
            className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Plan</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
