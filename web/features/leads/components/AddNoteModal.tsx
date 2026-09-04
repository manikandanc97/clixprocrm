import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { useAuth } from "@/features/auth/components/auth-provider";
import { NoteType } from "@/shared/types/lead";
import { toast } from "sonner";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface AddNoteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
}

export function AddNoteModal({ isOpen, onOpenChange, leadId }: AddNoteModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mention, setMention] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  
  const { leads, updateLead } = useCRMStore();
  const { user } = useAuth();

  const handleSave = () => {
    if (!leadId) return;
    if (!message.trim()) {
      toast.error("Note Message is required.");
      return;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const newNote: NoteType = {
      id: `note-${new Date().getTime()}`,
      leadId,
      userId: user?.id || "unknown",
      createdBy: user?.name || user?.email || "Current User",
      message,
      title: title || undefined,
      isPinned,
      mentions: mention ? [mention] : undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...(lead.notes || [])];
    
    // Pinned notes typically get sorted to the top in the UI, but we just save it here.
    updateLead(leadId, { notes: updatedNotes });

    toast.success("Note added successfully.");
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setMessage("");
    setMention("");
    setIsPinned(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border shadow-2xl rounded-xl overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Internal Note</DialogTitle>
            <DialogDescription className="text-xs">
              Record internal conversations, meeting summaries, or important info. Not visible to customers.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Title (Optional)</Label>
            <Input 
              name="title"
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Note Message <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Enter note details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><AppIcon name="user" size={13} /> Mention User (Optional)</Label>
              <Input 
                name="mention"
                placeholder="@username"
                value={mention}
                onChange={(e) => setMention(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
               <div className="flex items-center space-x-2 h-9 border border-border rounded-lg px-3 bg-muted/10">
                <Checkbox id="pin-note" checked={isPinned} onCheckedChange={(c) => setIsPinned(c === true)} />
                <Label htmlFor="pin-note" className="text-xs font-semibold cursor-pointer">Pin Note to Top</Label>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full h-9 border-dashed text-xs text-muted-foreground gap-2">
              <AppIcon name="file" size={14} /> Attach File (Optional)
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2 sm:space-x-0">
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-9 px-4 text-xs font-semibold">
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-9 px-6 text-xs font-bold rounded-lg shadow-sm">
            <AppIcon name="check" size={15} className="mr-1.5" />
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
