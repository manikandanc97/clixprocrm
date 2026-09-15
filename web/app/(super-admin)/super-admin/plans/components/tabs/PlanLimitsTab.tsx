"use client";

import React from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanLimitsTabProps {
  editingPlan: PlatformPlanItem;
  onPlanChange: (updated: PlatformPlanItem) => void;
}

export function PlanLimitsTab({
  editingPlan,
  onPlanChange,
}: PlanLimitsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-100">
      <p className="text-xs text-muted-foreground">
        Configure operational resource quotas for organizations subscribed to this tier. Use <strong>-1</strong> for Unlimited.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Max Users</Label>
            <span className="text-[10px] text-muted-foreground">
              {editingPlan.maxUsers === -1 ? "Unlimited" : `${editingPlan.maxUsers} users`}
            </span>
          </div>
          <Input
            type="number"
            value={editingPlan.maxUsers}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                maxUsers: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Max Leads</Label>
            <span className="text-[10px] text-muted-foreground">
              {editingPlan.maxLeads === -1 ? "Unlimited" : `${editingPlan.maxLeads} leads`}
            </span>
          </div>
          <Input
            type="number"
            value={editingPlan.maxLeads}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                maxLeads: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Max Contacts</Label>
            <span className="text-[10px] text-muted-foreground">
              {editingPlan.maxContacts === -1 ? "Unlimited" : `${editingPlan.maxContacts} contacts`}
            </span>
          </div>
          <Input
            type="number"
            value={editingPlan.maxContacts}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                maxContacts: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Storage Quota (GB)</Label>
          <Input
            type="number"
            min="1"
            value={editingPlan.storageGb}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                storageGb: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Max Monthly API Requests</Label>
          <span className="text-[10px] text-muted-foreground">
            {editingPlan.maxApiRequests === -1 ? "Unlimited" : `${(Number(editingPlan.maxApiRequests) || 0).toLocaleString()} req/mo`}
          </span>
        </div>
        <Input
          type="number"
          value={editingPlan.maxApiRequests}
          onChange={(e) =>
            onPlanChange({
              ...editingPlan,
              maxApiRequests: Number(e.target.value),
            })
          }
          className="rounded-xl h-10"
        />
      </div>
    </div>
  );
}
