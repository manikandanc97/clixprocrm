"use client";

import React from "react";
import { Factory, Trash2, Plus } from "lucide-react";
import { SettingsSection } from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

interface CompanyIndustriesSectionProps {
  industries: string[];
  industryUsageCounts: Record<string, number>;
  newIndustry: string;
  setNewIndustry: (val: string) => void;
  onAddIndustry: (e: React.FormEvent) => void;
  onInitiateDeleteIndustry: (ind: string) => void;
}

export function CompanyIndustriesSection({
  industries,
  industryUsageCounts,
  newIndustry,
  setNewIndustry,
  onAddIndustry,
  onInitiateDeleteIndustry,
}: CompanyIndustriesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Industry Classifications"
        description="Manage industry classifications available when categorizing company accounts. Includes safe deletion protection."
        icon={Factory}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {industries.map((ind) => {
              const count = industryUsageCounts[ind] || 0;
              return (
                <div
                  key={ind}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {ind}
                    </span>
                    {count > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-4 bg-muted text-muted-foreground font-normal shrink-0"
                      >
                        {count} {count === 1 ? "account" : "accounts"}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onInitiateDeleteIndustry(ind)}
                    aria-label={`Delete industry ${ind}`}
                    className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title={
                      count > 0
                        ? `Used by ${count} companies (requires reassignment)`
                        : "Delete classification"
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          <form onSubmit={onAddIndustry} className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40">
            <Input
              placeholder="New industry classification (e.g., Aerospace, Hospitality)..."
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              className="text-xs h-9 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="text-xs font-semibold h-9 shrink-0 gap-1"
              disabled={!newIndustry.trim()}
            >
              <Plus className="w-3.5 h-3.5" /> Add Industry
            </Button>
          </form>
        </div>
      </SettingsSection>
    </div>
  );
}
