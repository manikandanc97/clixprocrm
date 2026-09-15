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
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { AlertTriangle } from "lucide-react";

export interface CompanyIndustryReassignModalProps {
  industryToDelete: string | null;
  onClose: () => void;
  industryUsageCounts: Record<string, number>;
  reassignTargetIndustry: string;
  setReassignTargetIndustry: (val: string) => void;
  industries: string[];
  isReassigningIndustry: boolean;
  onConfirmReassignAndDelete: () => Promise<void>;
}

export function CompanyIndustryReassignModal({
  industryToDelete,
  onClose,
  industryUsageCounts,
  reassignTargetIndustry,
  setReassignTargetIndustry,
  industries,
  isReassigningIndustry,
  onConfirmReassignAndDelete,
}: CompanyIndustryReassignModalProps) {
  return (
    <Dialog
      open={!!industryToDelete}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Reassign Companies Before Deletion
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            <strong className="text-foreground font-semibold">
              &quot;{industryToDelete}&quot;
            </strong>{" "}
            is currently assigned to{" "}
            <strong className="text-foreground font-semibold">
              {industryToDelete ? industryUsageCounts[industryToDelete] || 0 : 0}
            </strong>{" "}
            company account(s). Please select a replacement industry before removing it to prevent broken references.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Replacement Industry
          </Label>
          <Select
            value={reassignTargetIndustry}
            onValueChange={setReassignTargetIndustry}
          >
            <SelectTrigger className="w-full text-xs h-9">
              <SelectValue placeholder="Select replacement industry..." />
            </SelectTrigger>
            <SelectContent>
              {industries
                .filter((ind) => ind !== industryToDelete)
                .map((ind) => (
                  <SelectItem key={ind} value={ind} className="text-xs">
                    {ind}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isReassigningIndustry}
            className="text-xs h-8.5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirmReassignAndDelete}
            disabled={!reassignTargetIndustry || isReassigningIndustry}
            className="text-xs h-8.5 font-semibold gap-1.5"
          >
            {isReassigningIndustry ? "Reassigning..." : "Reassign & Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
