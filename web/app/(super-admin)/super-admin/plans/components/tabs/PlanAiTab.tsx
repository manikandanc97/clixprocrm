"use client";

import React from "react";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanAiTabProps {
  editingPlan: PlatformPlanItem;
  aiModels: Array<{ id: string; modelKey: string; displayName: string; provider: string }>;
  onPlanChange: (updated: PlatformPlanItem) => void;
  toggleAllowedModel: (modelId: string) => void;
}

export function PlanAiTab({
  editingPlan,
  aiModels,
  onPlanChange,
  toggleAllowedModel,
}: PlanAiTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-100">
      <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">
            AI Features Enabled
          </p>
          <p className="text-[11px] text-muted-foreground">
            Enables AI Copilot, summary, RAG, and predictive lead scoring for this tier.
          </p>
        </div>
        <Switch
          checked={editingPlan.aiEnabled}
          onCheckedChange={(checked) =>
            onPlanChange({ ...editingPlan, aiEnabled: checked })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">AI Tier Level</Label>
          <select
            value={editingPlan.aiLevel}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                aiLevel: e.target.value,
              })
            }
            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
          >
            <option value="Basic AI">Basic AI</option>
            <option value="Standard AI">Standard AI</option>
            <option value="Advanced AI">Advanced AI</option>
            <option value="Premium AI">Premium AI</option>
            <option value="Full AI">Full AI</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Daily Token Quota</Label>
          <Input
            type="number"
            min="1000"
            step="5000"
            value={editingPlan.dailyTokenLimit}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                dailyTokenLimit: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-semibold">Authoritative Default Model</Label>
        <select
          value={editingPlan.defaultModelId || ""}
          onChange={(e) =>
            onPlanChange({
              ...editingPlan,
              defaultModelId: e.target.value,
            })
          }
          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground"
        >
          <option value="" disabled>Select default AI model</option>
          {aiModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName} ({m.provider}) - {m.modelKey}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-2">
        <Label className="text-xs font-semibold">Allowed AI Models Catalog</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 rounded-xl border border-border bg-muted/20">
          {aiModels.map((model) => {
            const isChecked = Array.isArray(editingPlan.allowedModelIds) && editingPlan.allowedModelIds.includes(model.id);
            return (
              <label
                key={model.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-foreground font-semibold"
                    : "border-border/60 text-muted-foreground hover:bg-background/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAllowedModel(model.id)}
                  className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                />
                <div className="truncate">
                  <p className="leading-tight truncate">{model.displayName}</p>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {model.provider}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
