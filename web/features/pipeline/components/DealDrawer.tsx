"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { PipelineLeadType, DealStage } from "@/shared/types/pipeline";
import { useUpdatePipelineItem } from "@/shared/hooks/use-crm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Clock, Check, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import { PIPELINE_STAGE_LABELS } from "@/lib/crm-formatters";

interface DealDrawerProps {
  item: PipelineLeadType | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange?: (deal: PipelineLeadType, newStage: string) => void;
}

const stageToProbability: Record<string, number> = {
  [DealStage.NEW]: 10,
  [DealStage.QUALIFIED]: 30,
  [DealStage.PROPOSAL]: 60,
  [DealStage.NEGOTIATION]: 80,
  [DealStage.WON]: 100,
  [DealStage.LOST]: 0,
};

export function DealDrawer({ item, isOpen, onClose, onStageChange }: DealDrawerProps) {
  const { mutate: updateDeal, isPending } = useUpdatePipelineItem();
  const { CurrencyIcon } = useCurrency();
  
  // Local state for editing
  const [formData, setFormData] = useState<Partial<PipelineLeadType>>({});
  const [prevItemId, setPrevItemId] = useState<string | undefined>(item?.id);
  const [noteText, setNoteText] = useState("");

  // Sync item to formData on open (during render as recommended to avoid cascading renders)
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setFormData({});
    setNoteText("");
  }

  if (!item) return null;

  const currentData = { ...item, ...formData };
  const currentStage = (currentData.stage || item.stage || DealStage.NEW) as string;
  const currentPriority = (currentData.priority || item.priority || "Low") as string;
  const stageDisplay = PIPELINE_STAGE_LABELS[currentStage] || currentStage;

  const hasChanges = Object.keys(formData).length > 0;

  const handleChange = (field: keyof PipelineLeadType, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload = {
      name: currentData.name,
      company: currentData.company,
      value: currentData.valueAmount,
      priority: currentData.priority,
    };

    // If stage was changed in the drawer, we save the other fields first,
    // then trigger the standard stage change flow (which handles Won/Lost modals)
    if (currentData.stage && currentData.stage !== item.stage && onStageChange) {
      updateDeal({
        id: item.id,
        data: payload
      }, {
        onSuccess: () => {
          toast.success("Deal updated successfully");
          onStageChange(item, currentData.stage as string);
        }
      });
      return;
    }

    updateDeal({
      id: item.id,
      data: payload
    }, {
      onSuccess: () => {
        toast.success("Deal updated successfully");
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh] bg-background border-border overflow-hidden rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold tracking-tight">Deal Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            View and manage opportunity details, stages, and activities.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              {stageDisplay}
            </Badge>
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
              {currentPriority} Priority
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <div className="px-6 pt-4 border-b border-border bg-background sticky top-0 z-10">
              <TabsList className="w-full flex items-center justify-start bg-transparent p-0 rounded-none h-auto gap-2 pb-4 overflow-x-auto border-none">
                <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-3 py-1.5 border border-transparent data-[state=active]:border-border/80 data-[state=active]:text-foreground data-[state=active]:bg-muted/50 text-muted-foreground bg-transparent shadow-none cursor-pointer">Overview</TabsTrigger>
                <TabsTrigger value="activities" className="rounded-lg text-xs font-semibold px-3 py-1.5 border border-transparent data-[state=active]:border-border/80 data-[state=active]:text-foreground data-[state=active]:bg-muted/50 text-muted-foreground bg-transparent shadow-none cursor-pointer">Activities</TabsTrigger>
                <TabsTrigger value="tasks" className="rounded-lg text-xs font-semibold px-3 py-1.5 border border-transparent data-[state=active]:border-border/80 data-[state=active]:text-foreground data-[state=active]:bg-muted/50 text-muted-foreground bg-transparent shadow-none cursor-pointer">Tasks</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-lg text-xs font-semibold px-3 py-1.5 border border-transparent data-[state=active]:border-border/80 data-[state=active]:text-foreground data-[state=active]:bg-muted/50 text-muted-foreground bg-transparent shadow-none cursor-pointer">Notes</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6 space-y-5 mt-0">
              {/* Editable Fields Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Deal Name</Label>
                  <Input 
                    type="text"
                    value={currentData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="h-9 text-sm font-medium bg-card"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Company</Label>
                  <Input 
                    type="text"
                    value={currentData.company || ""}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="h-9 text-sm font-medium bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Value</Label>
                  <div className="relative">
                    <CurrencyIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      type="number"
                      value={currentData.valueAmount ?? 0}
                      onChange={(e) => handleChange("valueAmount", Number(e.target.value))}
                      className="pl-9 h-9 text-sm font-medium bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Stage</Label>
                  <Select
                    value={currentStage}
                    onValueChange={(newStage) => {
                      handleChange("stage", newStage);
                      if (stageToProbability[newStage] !== undefined) {
                        handleChange("probability", stageToProbability[newStage]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs font-medium bg-card">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DealStage.NEW} className="text-xs">New Lead</SelectItem>
                      <SelectItem value={DealStage.QUALIFIED} className="text-xs">Qualified</SelectItem>
                      <SelectItem value={DealStage.PROPOSAL} className="text-xs">Proposal Sent</SelectItem>
                      <SelectItem value={DealStage.NEGOTIATION} className="text-xs">Negotiation</SelectItem>
                      <SelectItem value={DealStage.WON} className="text-xs">Won</SelectItem>
                      <SelectItem value={DealStage.LOST} className="text-xs">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Priority</Label>
                  <Select
                    value={currentPriority}
                    onValueChange={(val) => handleChange("priority", val)}
                  >
                    <SelectTrigger className="h-9 text-xs font-medium bg-card">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low" className="text-xs">Low</SelectItem>
                      <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                      <SelectItem value="High" className="text-xs">High</SelectItem>
                      <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Probability (%)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={currentData.probability ?? 0}
                    onChange={(e) => handleChange("probability", Number(e.target.value))}
                    className="h-9 text-sm font-medium bg-card"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="p-6">
              <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border/80 rounded-xl bg-muted/20">
                <Clock className="w-8 h-8 text-muted-foreground/70 mb-3" />
                <p className="text-sm font-semibold text-foreground">No recent activities</p>
                <p className="text-xs text-muted-foreground mt-1">Activities will appear here once logged.</p>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="p-6">
              <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border/80 rounded-xl bg-muted/20">
                <Check className="w-8 h-8 text-muted-foreground/70 mb-3" />
                <p className="text-sm font-semibold text-foreground">No tasks scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled tasks for this deal will be listed here.</p>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="p-6">
              <Textarea 
                placeholder="Type a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full h-32 text-sm bg-card border-border/80 rounded-xl p-3 resize-none mb-3"
              />
              <Button 
                onClick={() => {
                  if (noteText.trim()) {
                    toast.success("Note added successfully");
                    setNoteText("");
                  }
                }} 
                disabled={!noteText.trim()}
                className="w-full font-semibold text-xs h-9"
              >
                Add Note
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-border bg-card/50">
          <Button 
            onClick={handleSave} 
            disabled={isPending || !hasChanges} 
            className="w-full font-semibold text-xs h-9 gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" /> {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
