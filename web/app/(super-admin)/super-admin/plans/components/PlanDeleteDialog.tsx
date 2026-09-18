"use client";

import React from "react";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

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
  return (
    <CRMDeleteDialog
      mode="single"
      isOpen={Boolean(deletingPlan)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title="Delete Subscription Plan"
      itemName="Subscription Plan"
      description={
        deletingPlan ? (
          <>
            Are you sure you want to delete <strong className="text-foreground">{deletingPlan.name}</strong> (<span className="font-mono text-[11px]">{deletingPlan.id}</span>)?
          </>
        ) : null
      }
      warningText={
        distributionCount > 0 ? (
          <>
            This plan currently has <strong className="text-foreground">{distributionCount} active organization(s)</strong>. Deleting this tier will permanently remove the plan and automatically reassign all subscribed organizations to the <strong className="text-foreground">Free tier</strong>.
          </>
        ) : (
          <>
            This plan has <strong className="text-foreground">0 active workspaces</strong>. All AI entitlements and configuration for this tier will be permanently removed.
          </>
        )
      }
      onConfirm={() => {
        if (deletingPlan) onConfirm(deletingPlan);
      }}
      isDeleting={deleting}
      confirmLabel="Delete Plan"
    />
  );
}
