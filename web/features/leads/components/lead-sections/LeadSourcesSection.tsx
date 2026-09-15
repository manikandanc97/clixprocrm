"use client";

import React from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  SettingsSection,
} from "@/shared/components/crm/ContextualSettingsComponents";

export interface LeadSource {
  id: string;
  name: string;
  category: string;
  active: boolean;
  totalLeads: number;
}

interface LeadSourcesSectionProps {
  sources: LeadSource[];
  newSourceName: string;
  newSourceCat: string;
  setNewSourceName: (v: string) => void;
  setNewSourceCat: (v: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (e: React.FormEvent) => void;
}

export function LeadSourcesSection({
  sources,
  newSourceName,
  newSourceCat,
  setNewSourceName,
  setNewSourceCat,
  onToggleActive,
  onDelete,
  onAdd,
}: LeadSourcesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Lead Acquisition Sources & Channels"
        description="Manage inbound channels, attribution sources, and marketing tracking."
        icon={Layers}
      >
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:border-border transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {source.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{source.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {source.category} • {source.totalLeads} leads tracked
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {source.active ? "Active" : "Disabled"}
                  </span>
                  <Switch
                    checked={source.active}
                    onCheckedChange={() => onToggleActive(source.id)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(source.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Channel Form */}
        <form
          onSubmit={onAdd}
          className="mt-3 p-3 rounded-xl border border-dashed border-border/80 flex flex-col sm:flex-row items-center gap-2.5"
        >
          <Input
            placeholder="Channel name (e.g., Webinar, Google Ads)..."
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            className="text-xs h-9 flex-1"
          />
          <Input
            placeholder="Category (e.g., Paid Media)..."
            value={newSourceCat}
            onChange={(e) => setNewSourceCat(e.target.value)}
            className="text-xs h-9 w-full sm:w-40"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="text-xs font-semibold gap-1.5 h-9 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Channel
          </Button>
        </form>
      </SettingsSection>
    </div>
  );
}
