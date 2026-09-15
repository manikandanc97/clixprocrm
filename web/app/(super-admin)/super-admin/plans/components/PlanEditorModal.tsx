"use client";

import {
  CreditCard,
  Check,
  Building2,
  Sparkles,
  X,
  Sliders,
  CheckCircle2,
  Search,
  Bot,
  HardDrive,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { FeatureCatalogItem, PlatformPlanItem } from "@/shared/lib/api/super-admin.api";
import { ConfigTab } from "../utils/plan-features.util";

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
            {/* SECTION 1: BASIC */}
            {activeTab === "basic" && (
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
                    <select
                      value={editingPlan.status}
                      onChange={(e) =>
                        onPlanChange({
                          ...editingPlan,
                          status: e.target.value as "ACTIVE" | "INACTIVE" | "ARCHIVED",
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE (Available for subscriptions)</option>
                      <option value="INACTIVE">INACTIVE (Disabled / Hidden)</option>
                    </select>
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
            )}

            {/* SECTION 2: PRICING */}
            {activeTab === "pricing" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Currency</Label>
                    <select
                      value={editingPlan.currency}
                      onChange={(e) =>
                        onPlanChange({
                          ...editingPlan,
                          currency: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Pricing Mode</Label>
                    <select
                      value={editingPlan.pricingMode}
                      onChange={(e) =>
                        onPlanChange({
                          ...editingPlan,
                          pricingMode: e.target.value as "FIXED" | "CUSTOM",
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                    >
                      <option value="FIXED">Fixed Subscription Price</option>
                      <option value="CUSTOM">Custom Enterprise (Contact Sales)</option>
                    </select>
                  </div>
                </div>

                {editingPlan.pricingMode === "FIXED" ? (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Monthly Price ({editingPlan.currency})
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingPlan.priceNum}
                        onChange={(e) =>
                          onPlanChange({
                            ...editingPlan,
                            priceNum: Number(e.target.value),
                          })
                        }
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Annual Price ({editingPlan.currency}/year)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingPlan.annualPriceNum}
                        onChange={(e) =>
                          onPlanChange({
                            ...editingPlan,
                            annualPriceNum: Number(e.target.value),
                          })
                        }
                        className="rounded-xl h-10 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                    Enterprise custom pricing will display as <strong>&quot;Contact Sales&quot;</strong> on customer pricing pages. Subscriptions will be provisioned manually or via sales contracts.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Free Trial Period (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingPlan.trialDays}
                      onChange={(e) =>
                        onPlanChange({
                          ...editingPlan,
                          trialDays: Number(e.target.value),
                        })
                      }
                      className="rounded-xl h-10"
                      placeholder="e.g. 14"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-semibold">Supported Billing Cycles</Label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.billingCycleMonthly}
                          onChange={(e) =>
                            onPlanChange({
                              ...editingPlan,
                              billingCycleMonthly: e.target.checked,
                            })
                          }
                          className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                        />
                        Monthly
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.billingCycleAnnual}
                          onChange={(e) =>
                            onPlanChange({
                              ...editingPlan,
                              billingCycleAnnual: e.target.checked,
                            })
                          }
                          className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                        />
                        Annual
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: LIMITS */}
            {activeTab === "limits" && (
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
            )}

            {/* SECTION 4: AI ENTITLEMENTS */}
            {activeTab === "ai" && (
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
            )}

            {/* SECTION 5: FEATURES */}
            {activeTab === "features" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Search CRM feature catalog..."
                    className="pl-9 h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.keys(groupedFeatures).map((cat) => (
                    <div key={cat} className="space-y-2">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {cat}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groupedFeatures[cat].map((feat) => {
                          const isIncluded = Array.isArray(editingPlan.features) && editingPlan.features.includes(feat.name);
                          return (
                            <div
                              key={feat.key}
                              onClick={() => toggleFeature(feat.name)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                                isIncluded
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground font-semibold shadow-xs"
                                  : "border-border/60 text-muted-foreground hover:bg-muted/40"
                              }`}
                            >
                              <div>
                                <p className="text-xs font-semibold leading-tight text-foreground">
                                  {feat.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                  {feat.description}
                                </p>
                              </div>
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                                  isIncluded
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {isIncluded && <Check className="h-3 w-3" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
