"use client";

import { LeadStatus, LeadType } from "@/shared/types/lead";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { LEAD_STATUS_LABELS } from "@/lib/crm-formatters";
import { cn } from "@/shared/lib/utils";

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadType | null;
  onSelectTargetStage: (lead: LeadType, targetStage: string) => void;
}

export function StageTransitionModal({ isOpen, onClose, lead, onSelectTargetStage }: StageTransitionModalProps) {
  const [selectedStage, setSelectedStage] = useState<string>("");

  if (!isOpen || !lead) return null;

  const stages = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];
  
  const handleConfirm = () => {
    if (selectedStage && selectedStage !== lead.stage) {
      onSelectTargetStage(lead, selectedStage);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Deal Stage</DialogTitle>
          <DialogDescription className="pt-2 text-sm text-foreground">
            Select the new stage for <strong>{lead.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            {stages.map((stage) => {
              const isCurrent = stage === lead.stage;
              const isSelected = stage === selectedStage;
              
              return (
                <button
                  key={stage}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedStage(stage)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                    isCurrent ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60" 
                      : isSelected ? "bg-primary/10 border-primary text-primary" 
                      : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span>{LEAD_STATUS_LABELS[stage]}</span>
                    {isCurrent && <span className="text-xs uppercase tracking-wider font-bold">Current</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleConfirm} 
            disabled={!selectedStage || selectedStage === lead.stage}
          >
            <AppIcon name="arrowRight" size={15} className="mr-1.5" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
