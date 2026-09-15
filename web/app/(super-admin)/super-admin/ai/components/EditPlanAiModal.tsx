"use client";

import React from "react";
import { Edit3, Check, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  PlanAiConfigItem,
  PlatformAiModelItem,
} from "@/shared/lib/api/super-admin.api";

interface EditPlanAiModalProps {
  isPlanModalOpen: boolean;
  setIsPlanModalOpen: (open: boolean) => void;
  selectedPlanForEdit: PlanAiConfigItem | null;
  planForm: {
    aiEnabled: boolean;
    aiLevel: string;
    dailyTokenLimit: number;
    allowedModelIds: string[];
    defaultModelId: string;
  };
  setPlanForm: React.Dispatch<
    React.SetStateAction<{
      aiEnabled: boolean;
      aiLevel: string;
      dailyTokenLimit: number;
      allowedModelIds: string[];
      defaultModelId: string;
    }>
  >;
  allModels: PlatformAiModelItem[];
  savingPlan: boolean;
  handleSavePlan: () => void;
}

export function EditPlanAiModal({
  isPlanModalOpen,
  setIsPlanModalOpen,
  selectedPlanForEdit,
  planForm,
  setPlanForm,
  allModels,
  savingPlan,
  handleSavePlan,
}: EditPlanAiModalProps) {
  return (
    <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/80 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            Edit {selectedPlanForEdit?.name} Plan Entitlements
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure AI availability, access tier, token quotas, and permitted models.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[calc(88vh-130px)]">
          {/* AI Access Toggle */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground">AI Services</Label>
              <p className="text-[11px] text-muted-foreground">
                {planForm.aiEnabled
                  ? "Subscribed organizations can utilize entitled AI features."
                  : "AI access is turned off for this plan tier."}
              </p>
            </div>
            <Switch
              checked={planForm.aiEnabled}
              onCheckedChange={(checked) =>
                setPlanForm((prev) => ({ ...prev, aiEnabled: checked }))
              }
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {/* AI Access Level Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">AI Access Level</Label>
            <Input
              value={planForm.aiLevel}
              onChange={(e) =>
                setPlanForm((prev) => ({ ...prev, aiLevel: e.target.value }))
              }
              placeholder="e.g. Basic AI, Advanced AI, Premium AI"
              className="h-9 text-xs rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Display badge shown to users on this subscription tier.
            </p>
          </div>

          {/* Daily Token Limit */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Daily Token Limit / Workspace
            </Label>
            <Input
              type="number"
              value={planForm.dailyTokenLimit}
              onChange={(e) =>
                setPlanForm((prev) => ({
                  ...prev,
                  dailyTokenLimit: Number(e.target.value),
                }))
              }
              className="h-9 text-xs font-mono rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum token capacity consumed per 24-hour cycle.
            </p>
          </div>

          {/* Allowed Models Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">Allowed Models</Label>
              <span className="text-[11px] text-muted-foreground">
                {planForm.allowedModelIds.length} selected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select which models this plan tier is permitted to execute.
            </p>

            <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
              {allModels.map((model) => {
                const isAllowed = planForm.allowedModelIds.includes(model.id);

                return (
                  <label
                    key={model.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isAllowed
                        ? "bg-primary/5 border-primary/40 text-foreground"
                        : "bg-card border-border/70 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...planForm.allowedModelIds, model.id]
                          : planForm.allowedModelIds.filter((id) => id !== model.id);

                        let nextDefault = planForm.defaultModelId;
                        if (!e.target.checked && planForm.defaultModelId === model.id) {
                          nextDefault = next.length > 0 ? next[0] : "";
                        }

                        setPlanForm((prev) => ({
                          ...prev,
                          allowedModelIds: next,
                          defaultModelId: nextDefault,
                        }));
                      }}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="space-y-0.5 overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {model.displayName}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0">
                          {model.provider}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block truncate">
                        {model.modelKey}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Default Model Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">Default Model</Label>
            <p className="text-[11px] text-muted-foreground">
              Primary model assigned out-of-the-box for this plan. Must be one of the
              allowed models.
            </p>

            {planForm.allowedModelIds.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground rounded-xl bg-muted/40 border border-border">
                Select at least one allowed model first.
              </div>
            ) : (
              <div className="space-y-2 pt-1 max-h-40 overflow-y-auto pr-1">
                {allModels
                  .filter((m) => planForm.allowedModelIds.includes(m.id))
                  .map((model) => {
                    const isDefault = planForm.defaultModelId === model.id;

                    return (
                      <label
                        key={model.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isDefault
                            ? "bg-primary/10 border-primary text-foreground font-semibold"
                            : "bg-card border-border/70 text-muted-foreground hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input
                            type="radio"
                            name="plan_default_model"
                            checked={isDefault}
                            onChange={() =>
                              setPlanForm((prev) => ({
                                ...prev,
                                defaultModelId: model.id,
                              }))
                            }
                            className="text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {model.displayName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              {model.provider.toUpperCase()} • {model.modelKey}
                            </span>
                          </div>
                        </div>
                        {isDefault && (
                          <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                        )}
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPlanModalOpen(false)}
            className="text-xs h-9 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={savingPlan}
            onClick={handleSavePlan}
            className="bg-primary text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {savingPlan ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Entitlements"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
