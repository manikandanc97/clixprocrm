import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { PipelineLeadType } from "@/shared/types/pipeline";
import { Loader2 } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Deal</DialogTitle>
          <DialogDescription className="pt-2 text-sm text-foreground">
            Are you sure you want to move this deal?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Deal</p>
            <p className="font-semibold text-sm">{deal.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">From</p>
              <p className="font-semibold text-sm">{deal.stage}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary uppercase tracking-wider font-bold mb-1">To</p>
              <p className="font-semibold text-sm text-primary">{targetStage}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={showLoading}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <Button variant="default" onClick={handleLocalSubmit} disabled={showLoading} className="gap-2">
            {showLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AppIcon name="check" size={15} />}
            {showLoading ? "Confirming..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
