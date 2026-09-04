import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { PipelineLeadType } from "@/shared/types/pipeline";
import { Loader2, X, Check, ArrowRight } from "lucide-react";
import { PIPELINE_STAGE_LABELS } from "@/lib/crm-formatters";

interface ConfirmMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: PipelineLeadType | null;
  targetStage: string | null;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function ConfirmMoveModal({ isOpen, onClose, deal, targetStage, onSubmit, isLoading }: ConfirmMoveModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setInternalLoading(false);
    }
  }

  if (!isOpen || !deal || !targetStage) return null;

  const showLoading = isLoading || internalLoading;

  const handleLocalSubmit = () => {
    setInternalLoading(true);
    onSubmit();
  };

  const fromLabel = PIPELINE_STAGE_LABELS[deal.stage] || deal.stage;
  const toLabel = PIPELINE_STAGE_LABELS[targetStage] || targetStage;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Move Deal Stage</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Confirm moving this opportunity to a new pipeline stage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          <div className="p-3 bg-muted/30 rounded-lg border border-border/80">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Opportunity</p>
            <p className="font-semibold text-sm text-foreground">{deal.name}</p>
            {deal.company && deal.company !== deal.name && (
              <p className="text-xs text-muted-foreground">{deal.company}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/80">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Current Stage</p>
              <p className="font-semibold text-xs text-foreground truncate">{fromLabel}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-[10px] text-primary uppercase tracking-wider font-bold mb-0.5">Target Stage</p>
              <p className="font-semibold text-xs text-primary truncate">{toLabel}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={showLoading} className="h-9 text-xs font-semibold cursor-pointer">
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleLocalSubmit} disabled={showLoading} className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
            {showLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {showLoading ? "Moving..." : "Confirm Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
