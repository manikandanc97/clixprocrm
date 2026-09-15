"use client";

import React from "react";
import { SlidersHorizontal, Plus, Lock, Trash2 } from "lucide-react";
import { SettingsSection } from "@/shared/components/crm/ContextualSettingsComponents";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  CustomField,
  StandardFieldConfig,
} from "../../constants/company-settings.constants";

interface CompanyFieldsSectionProps {
  standardFields: StandardFieldConfig[];
  customFields: CustomField[];
  onToggleStandardField: (id: string, visible: boolean) => void;
  onOpenAddCustomField: () => void;
  onRemoveCustomField: (id: string) => void;
}

export function CompanyFieldsSection({
  standardFields,
  customFields,
  onToggleStandardField,
  onOpenAddCustomField,
  onRemoveCustomField,
}: CompanyFieldsSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Standard Account Fields"
        description="Manage core attributes and visibility in company records and forms."
        icon={SlidersHorizontal}
      >
        <div className="divide-y divide-border/40">
          {standardFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between py-2.5 px-1 text-xs"
            >
              <div className="space-y-0.5 max-w-lg min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {field.label}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 h-4 font-medium text-muted-foreground"
                  >
                    {field.type}
                  </Badge>
                  {field.systemLocked && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 h-4 gap-1 bg-muted font-semibold text-muted-foreground"
                    >
                      <Lock className="w-2.5 h-2.5" /> System Core
                    </Badge>
                  )}
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-normal">
                  {field.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {field.systemLocked ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground border-border/70"
                  >
                    Always Visible
                  </Badge>
                ) : (
                  <Switch
                    checked={field.visible}
                    onCheckedChange={(c) => onToggleStandardField(field.id, c)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Custom Fields Section */}
      <SettingsSection
        title="Custom Fields"
        description="Add bespoke metadata fields tailored to your organization's business workflow."
        icon={Plus}
        headerAction={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenAddCustomField}
            className="h-8 text-xs font-semibold gap-1.5 border-border/80"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Field
          </Button>
        }
      >
        {customFields.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border/70 rounded-lg text-muted-foreground text-xs">
            <p>No custom fields defined.</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Click &quot;+ Add Custom Field&quot; to capture custom data points.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {customFields.map((cf) => (
              <div
                key={cf.id}
                className="flex items-center justify-between py-2.5 px-1 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {cf.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 uppercase">
                      {cf.type}
                    </Badge>
                    {cf.required && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                        Required
                      </Badge>
                    )}
                  </div>
                  {cf.options && (
                    <p className="text-[11px] text-muted-foreground">
                      Options: {cf.options}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveCustomField(cf.id)}
                  className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
