"use client";

import React from "react";
import { ListOrdered, Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  SettingsSection,
} from "@/shared/components/crm/ContextualSettingsComponents";

export interface LeadStatusDef {
  id: string;
  name: string;
  key: string;
  color: string;
  slaDays: number;
  isDefault?: boolean;
}

interface LeadStatusesSectionProps {
  statuses: LeadStatusDef[];
  newStatusName: string;
  setNewStatusName: (v: string) => void;
  onChangeSla: (id: string, val: number) => void;
  onDelete: (id: string) => void;
  onAdd: (e: React.FormEvent) => void;
}

export function LeadStatusesSection({
  statuses,
  newStatusName,
  setNewStatusName,
  onChangeSla,
  onDelete,
  onAdd,
}: LeadStatusesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Lead Lifecycle Stages & Statuses"
        description="Customize qualification statuses, follow-up SLA targets, and progression flow."
        icon={ListOrdered}
      >
        <div className="space-y-2.5">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:border-border transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <div className={`w-2.5 h-2.5 rounded-full ${status.color} shrink-0`} />
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    {status.name}
                    {status.isDefault && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                        Default
                      </Badge>
                    )}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground font-mono">
                    Key: {status.key}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">SLA:</span>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={status.slaDays}
                    onChange={(e) => onChangeSla(status.id, parseInt(e.target.value) || 0)}
                    className="w-14 h-7 text-xs text-center"
                  />
                  <span className="text-[11px] text-muted-foreground">days</span>
                </div>

                {!status.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(status.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={onAdd}
          className="mt-3 p-3 rounded-xl border border-dashed border-border/80 flex items-center gap-2"
        >
          <Input
            placeholder="New stage name (e.g., Demo Scheduled)..."
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            className="text-xs h-9 flex-1"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="text-xs font-semibold gap-1.5 h-9 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Status
          </Button>
        </form>
      </SettingsSection>
    </div>
  );
}
