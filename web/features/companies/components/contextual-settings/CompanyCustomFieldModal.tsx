"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface CompanyCustomFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCustomFieldName: string;
  setNewCustomFieldName: (val: string) => void;
  newCustomFieldType: "text" | "number" | "url" | "currency" | "date" | "select" | "boolean";
  setNewCustomFieldType: (val: "text" | "number" | "url" | "currency" | "date" | "select" | "boolean") => void;
  newCustomFieldOptions: string;
  setNewCustomFieldOptions: (val: string) => void;
  newCustomFieldRequired: boolean;
  setNewCustomFieldRequired: (val: boolean) => void;
  onAddCustomField: (e: React.FormEvent) => void;
}

export function CompanyCustomFieldModal({
  open,
  onOpenChange,
  newCustomFieldName,
  setNewCustomFieldName,
  newCustomFieldType,
  setNewCustomFieldType,
  newCustomFieldOptions,
  setNewCustomFieldOptions,
  newCustomFieldRequired,
  setNewCustomFieldRequired,
  onAddCustomField,
}: CompanyCustomFieldModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onAddCustomField}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Add Custom Company Field
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a custom attribute to capture organization-specific metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Field Label</Label>
              <Input
                placeholder="e.g. LinkedIn Company URL, Parent Holding, Fiscal Year End..."
                value={newCustomFieldName}
                onChange={(e) => setNewCustomFieldName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data Type</Label>
              <Select
                value={newCustomFieldType}
                onValueChange={(val: "text" | "number" | "url" | "currency" | "date" | "select" | "boolean") =>
                  setNewCustomFieldType(val)
                }
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text" className="text-xs">Text (Single Line)</SelectItem>
                  <SelectItem value="number" className="text-xs">Numeric Number</SelectItem>
                  <SelectItem value="url" className="text-xs">Website / Profile URL</SelectItem>
                  <SelectItem value="currency" className="text-xs">Currency Amount</SelectItem>
                  <SelectItem value="date" className="text-xs">Date Picker</SelectItem>
                  <SelectItem value="select" className="text-xs">Dropdown Select</SelectItem>
                  <SelectItem value="boolean" className="text-xs">Checkbox (Yes/No)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCustomFieldType === "select" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Options (comma-separated)</Label>
                <Input
                  placeholder="e.g. Tier 1, Tier 2, Tier 3"
                  value={newCustomFieldOptions}
                  onChange={(e) => setNewCustomFieldOptions(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Required Field</Label>
                <p className="text-[11px] text-muted-foreground">
                  Must be populated when creating a company
                </p>
              </div>
              <Switch
                checked={newCustomFieldRequired}
                onCheckedChange={setNewCustomFieldRequired}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8.5 font-semibold"
              disabled={!newCustomFieldName.trim()}
            >
              Add Field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
