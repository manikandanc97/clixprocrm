import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { PipelineLeadType, DealStage } from "@/shared/types/pipeline";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Trophy, XCircle, Loader2, X, Star } from "lucide-react";
import { useCurrency } from "@/shared/hooks/use-currency";

export interface WonLostSubmitData {
  reason: string;
  competitor?: string;
  actualRevenue?: number;
  wonDate?: string;
  notes?: string;
}

interface WonLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "WON" | "LOST" | null;
  deal: PipelineLeadType | null;
  onSubmit: (data: WonLostSubmitData) => void;
  isLoading?: boolean;
}

export function WonLostModal({ isOpen, onClose, type, deal, onSubmit, isLoading }: WonLostModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const { CurrencyIcon } = useCurrency();
  const [reason, setReason] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [actualRevenue, setActualRevenue] = useState("");
  const [wonDate, setWonDate] = useState("");
  const [notes, setNotes] = useState("");
  const [prevDealId, setPrevDealId] = useState<string | undefined>(deal?.id);

  if (deal?.id !== prevDealId) {
    setPrevDealId(deal?.id);
    setReason("");
    setCompetitor("");
    setNotes("");
    setActualRevenue(deal?.valueAmount?.toString() || "");
    setWonDate(new Date().toISOString().split("T")[0]);
    setInternalLoading(false);
  }

  const showLoading = isLoading || internalLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInternalLoading(true);
    onSubmit({ 
      reason, 
      competitor: type === DealStage.LOST ? competitor : undefined,
      actualRevenue: type === DealStage.WON ? Number(actualRevenue) : undefined,
      wonDate: type === DealStage.WON ? wonDate : undefined,
      notes
    });
  };

  if (!isOpen || !type || !deal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden gap-0 bg-background border-border rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            {type === DealStage.WON ? (
              <>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
                  <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Mark as Won
              </>
            ) : (
              <>
                <div className="p-2 bg-destructive/10 rounded-full">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                Mark as Lost
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {type === DealStage.WON 
              ? "Record actual revenue and closing details for this won deal."
              : "Capture reasons and notes for losing this opportunity."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === DealStage.WON && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Actual Revenue <span className="text-destructive ml-0.5">*</span></Label>
                <div className="relative">
                  <CurrencyIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    required
                    value={actualRevenue}
                    onChange={(e) => setActualRevenue(e.target.value)}
                    className="pl-9 h-9 text-sm bg-card font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Won Date <span className="text-destructive ml-0.5">*</span></Label>
                <div className="relative">
                  <Input
                    type="date"
                    required
                    value={wonDate}
                    onChange={(e) => setWonDate(e.target.value)}
                    className="w-full h-9 text-sm bg-card font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {type === DealStage.WON ? "What helped us win this deal?" : "Why was this deal lost?"}
              {type === DealStage.LOST ? (
                <span className="text-destructive ml-0.5">*</span>
              ) : (
                <span className="text-muted-foreground font-normal ml-0.5">(Optional)</span>
              )}
            </Label>
            <Input
              type="text"
              required={type === DealStage.LOST}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === DealStage.WON ? "Great features, pricing..." : "Pricing, missing features..."}
              className="h-9 text-sm bg-card font-medium"
            />
          </div>

          {type === DealStage.LOST && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Competitor <span className="text-muted-foreground font-normal ml-0.5">(Optional)</span></Label>
              <Input
                type="text"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                placeholder="Who did we lose to?"
                className="h-9 text-sm bg-card font-medium"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Notes {type === DealStage.LOST ? <span className="text-destructive ml-0.5">*</span> : <span className="text-muted-foreground font-normal ml-0.5">(Optional)</span>}
            </Label>
            <Textarea
              required={type === DealStage.LOST}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none min-h-[90px] text-sm bg-card font-medium"
              placeholder="Additional details..."
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={showLoading} className="w-full sm:w-auto h-9 text-xs font-semibold cursor-pointer">
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={showLoading} variant={type === DealStage.WON ? "default" : "destructive"} className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 cursor-pointer">
              {showLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : type === DealStage.WON ? <Star className="w-3.5 h-3.5 fill-current" /> : <XCircle className="w-3.5 h-3.5" />}
              {showLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
