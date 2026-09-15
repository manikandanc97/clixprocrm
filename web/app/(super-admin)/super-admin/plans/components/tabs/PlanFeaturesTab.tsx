"use client";

import React from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { FeatureCatalogItem, PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanFeaturesTabProps {
  editingPlan: PlatformPlanItem;
  featureSearch: string;
  setFeatureSearch: (search: string) => void;
  groupedFeatures: Record<string, FeatureCatalogItem[]>;
  toggleFeature: (featureName: string) => void;
}

export function PlanFeaturesTab({
  editingPlan,
  featureSearch,
  setFeatureSearch,
  groupedFeatures,
  toggleFeature,
}: PlanFeaturesTabProps) {
  return (
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
                const isIncluded =
                  Array.isArray(editingPlan.features) &&
                  editingPlan.features.includes(feat.name);
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
  );
}
