"use client";

import React from "react";
import {
  CreditCard,
  Building2,
  X,
  Sliders,
  CheckCircle2,
  Bot,
  HardDrive,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { FeatureCatalogItem, PlatformPlanItem } from "@/shared/lib/api/super-admin.api";
import { ConfigTab } from "../utils/plan-features.util";
import { PlanBasicTab } from "./tabs/PlanBasicTab";
import { PlanPricingTab } from "./tabs/PlanPricingTab";
import { PlanLimitsTab } from "./tabs/PlanLimitsTab";
import { PlanAiTab } from "./tabs/PlanAiTab";
import { PlanFeaturesTab } from "./tabs/PlanFeaturesTab";

interface PlanEditorModalProps {
  editingPlan: PlatformPlanItem | null;
  isCreatingNew: boolean;
  saving: boolean;
  deleting: boolean;
  isDirty: boolean;
  activeTab: ConfigTab;
  setActiveTab: (tab: ConfigTab) => void;
  featureSearch: string;
  setFeatureSearch: (search: string) => void;
  aiModels: Array<{ id: string; modelKey: string; displayName: string; provider: string }>;
  groupedFeatures: Record<string, FeatureCatalogItem[]>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (plan: PlatformPlanItem) => void;
  onPlanChange: (updated: PlatformPlanItem) => void;
  toggleFeature: (featureName: string) => void;
  toggleAllowedModel: (modelId: string) => void;
}

export function PlanEditorModal({
  editingPlan,
  isCreatingNew,
  saving,
  deleting,
  isDirty,
  activeTab,
  setActiveTab,
  featureSearch,
  setFeatureSearch,
  aiModels,
  groupedFeatures,
  onClose,
  onSave,
  onDelete,
  onPlanChange,
  toggleFeature,
  toggleAllowedModel,
}: PlanEditorModalProps) {
  if (!editingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {isCreatingNew ? <Plus className="h-5 w-5" /> : <Sliders className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground">
                  {isCreatingNew ? "Create New Subscription Plan" : `Edit Tier: ${editingPlan.name}`}
                </h3>
                {!isCreatingNew && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase border">
                    {editingPlan.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCreatingNew
                  ? "Define pricing, resource limits, AI model entitlements, and features"
                  : "Update production tier pricing, limits, AI entitlements & features"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 5-Tab Navigation Header */}
        <div className="flex items-center border-b border-border bg-muted/40 px-5 overflow-x-auto gap-1">
          {[
            { id: "basic", label: "1. Basic", icon: Building2 },
            { id: "pricing", label: "2. Pricing", icon: CreditCard },
            { id: "limits", label: "3. Limits", icon: HardDrive },
            { id: "ai", label: "4. AI Config", icon: Bot },
            { id: "features", label: "5. Features", icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ConfigTab)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "border-emerald-600 text-emerald-600 bg-background/80 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Tab Content */}
        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {activeTab === "basic" && (
              <PlanBasicTab
                editingPlan={editingPlan}
                isCreatingNew={isCreatingNew}
                onPlanChange={onPlanChange}
              />
            )}

            {activeTab === "pricing" && (
              <PlanPricingTab
                editingPlan={editingPlan}
                onPlanChange={onPlanChange}
              />
            )}

            {activeTab === "limits" && (
              <PlanLimitsTab
                editingPlan={editingPlan}
                onPlanChange={onPlanChange}
              />
            )}

            {activeTab === "ai" && (
              <PlanAiTab
                editingPlan={editingPlan}
                aiModels={aiModels}
                onPlanChange={onPlanChange}
                toggleAllowedModel={toggleAllowedModel}
              />
            )}

            {activeTab === "features" && (
              <PlanFeaturesTab
                editingPlan={editingPlan}
                featureSearch={featureSearch}
                setFeatureSearch={setFeatureSearch}
                groupedFeatures={groupedFeatures}
                toggleFeature={toggleFeature}
              />
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <div>
              {!isCreatingNew && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving || deleting}
                  onClick={() => onDelete(editingPlan)}
                  className="text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Plan
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || saving}
                className={`font-bold rounded-xl text-xs shadow-md transition-all ${
                  !isDirty || saving
                    ? "opacity-50 cursor-not-allowed bg-emerald-600/50 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                }`}
              >
                {saving
                  ? "Saving..."
                  : isCreatingNew
                  ? "Create Plan Tier"
                  : "Save Configuration"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
