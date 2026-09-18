"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanBasicTabProps {
  editingPlan: PlatformPlanItem;
  isCreatingNew: boolean;
  onPlanChange: (updated: PlatformPlanItem) => void;
}

export function PlanBasicTab({
  editingPlan,
  isCreatingNew,
  onPlanChange,
}: PlanBasicTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Plan Name *</Label>
          <Input
            value={editingPlan.name}
            onChange={(e) =>
              onPlanChange({ ...editingPlan, name: e.target.value })
            }
            className="rounded-xl h-10 font-semibold"
            placeholder="Enter plan name"
            required
          />
        </div>

        {isCreatingNew ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Plan Slug / ID (Optional)</Label>
            <Input
              value={editingPlan.id}
              onChange={(e) =>
                onPlanChange({
                  ...editingPlan,
                  id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                })
              }
              className="rounded-xl h-10 font-mono text-xs"
              placeholder="Enter plan slug"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Plan Identifier</Label>
            <Input
              value={editingPlan.id}
              disabled
              className="rounded-xl h-10 font-mono text-xs bg-muted/50 cursor-not-allowed"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Short Description</Label>
        <Input
          value={editingPlan.description}
          onChange={(e) =>
            onPlanChange({
              ...editingPlan,
              description: e.target.value,
            })
          }
          className="rounded-xl h-10"
          placeholder="Enter plan description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Plan Status</Label>
          <Select 
            value={editingPlan.status} 
            onValueChange={(val) => 
              onPlanChange({
                ...editingPlan,
                status: val as "ACTIVE" | "INACTIVE" | "ARCHIVED",
              })
            }
          >
            <SelectTrigger className="w-full h-10 px-3 border-input bg-background text-xs font-semibold">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE (Available for subscriptions)</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE (Disabled / Hidden)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Display Sort Order</Label>
          <Input
            type="number"
            value={editingPlan.sortOrder}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                sortOrder: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between mt-4">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-foreground">
              Most Popular Tier Badge
            </p>
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Highlight this tier as the recommended / most popular choice across tenant pricing views.
          </p>
        </div>
        <Switch
          checked={editingPlan.highlight}
          onCheckedChange={(checked) =>
            onPlanChange({ ...editingPlan, highlight: checked })
          }
        />
      </div>
    </div>
  );
}
