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
import { Badge } from "@/shared/ui/badge";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { GitMerge } from "lucide-react";

export interface CompanyItem {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  _count?: {
    customers?: number;
    deals?: number;
  };
}

export interface CompanyMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companiesList: CompanyItem[];
  mergePrimaryId: string;
  setMergePrimaryId: (id: string) => void;
  mergeSecondaryId: string;
  setMergeSecondaryId: (id: string) => void;
  isMerging: boolean;
  onExecuteMerge: () => Promise<void>;
}

export function CompanyMergeModal({
  open,
  onOpenChange,
  companiesList,
  mergePrimaryId,
  setMergePrimaryId,
  mergeSecondaryId,
  setMergeSecondaryId,
  isMerging,
  onExecuteMerge,
}: CompanyMergeModalProps) {
  const primaryCompany = companiesList.find((c) => c.id === mergePrimaryId);
  const secondaryCompany = companiesList.find((c) => c.id === mergeSecondaryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <GitMerge className="w-4 h-4 text-emerald-600" />
            Review & Merge Company Accounts
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select the Master (Primary) record to keep and the Duplicate (Secondary) record to merge. All linked contacts, deals, invoices, and timeline history will be safely transferred.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Selector */}
            <div className="space-y-1.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Master Record (To Keep)
                </Label>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                  Primary
                </Badge>
              </div>
              <Select value={mergePrimaryId} onValueChange={setMergePrimaryId}>
                <SelectTrigger className="w-full text-xs h-9 bg-card">
                  <SelectValue placeholder="Select primary company..." />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {companiesList
                    .filter((c: CompanyItem) => c.id !== mergeSecondaryId)
                    .map((c: CompanyItem) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} ({c.industry || "No Industry"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secondary Selector */}
            <div className="space-y-1.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Duplicate Record (To Merge & Archive)
                </Label>
                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/30">
                  Duplicate
                </Badge>
              </div>
              <Select value={mergeSecondaryId} onValueChange={setMergeSecondaryId}>
                <SelectTrigger className="w-full text-xs h-9 bg-card">
                  <SelectValue placeholder="Select duplicate company..." />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {companiesList
                    .filter((c: CompanyItem) => c.id !== mergePrimaryId)
                    .map((c: CompanyItem) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} ({c.industry || "No Industry"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Side-by-Side Field Comparison Table */}
          {primaryCompany && secondaryCompany && (
            <div className="rounded-lg border border-border overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-muted/60 p-2 font-bold text-[11px] border-b border-border">
                <span>Attribute</span>
                <span className="text-emerald-700 dark:text-emerald-400">Master Record</span>
                <span className="text-rose-700 dark:text-rose-400">Duplicate Record</span>
              </div>
              <div className="divide-y divide-border/50 text-[11.5px]">
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="font-medium text-muted-foreground">Name</span>
                  <span className="font-semibold text-foreground">{primaryCompany.name}</span>
                  <span className="text-muted-foreground line-through">{secondaryCompany.name}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="font-medium text-muted-foreground">Industry</span>
                  <span>{primaryCompany.industry || secondaryCompany.industry || "—"}</span>
                  <span className="text-muted-foreground">{secondaryCompany.industry || "—"}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="font-medium text-muted-foreground">Website</span>
                  <span>{primaryCompany.website || secondaryCompany.website || "—"}</span>
                  <span className="text-muted-foreground">{secondaryCompany.website || "—"}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="font-medium text-muted-foreground">Phone</span>
                  <span>{primaryCompany.phone || secondaryCompany.phone || "—"}</span>
                  <span className="text-muted-foreground">{secondaryCompany.phone || "—"}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="font-medium text-muted-foreground">Contacts / Deals</span>
                  <span className="text-emerald-600 font-semibold">
                    +{secondaryCompany._count?.customers || 0} Contacts, +{secondaryCompany._count?.deals || 0} Deals transferred
                  </span>
                  <span className="text-muted-foreground">
                    {secondaryCompany._count?.customers || 0} Contacts, {secondaryCompany._count?.deals || 0} Deals
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}
            className="text-xs h-8.5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onExecuteMerge}
            disabled={!mergePrimaryId || !mergeSecondaryId || isMerging}
            className="text-xs h-8.5 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isMerging ? "Merging..." : "Confirm & Merge Accounts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
