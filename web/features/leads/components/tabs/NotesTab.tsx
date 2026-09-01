import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { MessageSquare, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLeadNotes, useCreateLeadNote } from "@/shared/hooks/use-crm";
import { Textarea } from "@/shared/ui/textarea";
import { EmptyState } from "@/shared/components/EmptyState";
import { NotesSkeleton } from "@/shared/components/skeletons";

export function NotesTab({ leadId }: { leadId: string }) {
  const { data: notesResp, isLoading } = useLeadNotes(leadId);
  const notes = notesResp?.data || [];
  
  const createNote = useCreateLeadNote();
  const [newMessage, setNewMessage] = useState("");

  const handleAddNote = () => {
    if (!newMessage.trim()) return;
    createNote.mutate({ leadId, data: { message: newMessage } }, {
      onSuccess: () => setNewMessage("")
    });
  };

  const sortedNotes = [...notes].sort((a: ReturnType<typeof JSON.parse>, b: ReturnType<typeof JSON.parse>) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground">Lead Notes & Conversation History</h3>
      </div>

      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-3">
        <Textarea 
          placeholder="Add a new note..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="min-h-[80px] text-sm resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleAddNote} disabled={createNote.isPending || !newMessage.trim()}>
            {createNote.isPending ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="pt-2">
          <NotesSkeleton items={3} />
        </div>
      ) : sortedNotes.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No notes found"
          description="Add internal notes to keep track of conversations and updates."
          size="sm"
        />
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border -z-10" />

          {sortedNotes.map((note: ReturnType<typeof JSON.parse>) => (
            <div key={note.id} className="flex gap-4 relative">
              <div className="flex flex-col items-center z-10 pt-1">
                <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {note.user?.name ? note.user.name.substring(0, 2).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 bg-card border border-border/60 rounded-xl p-4 shadow-sm relative group">
                {note.isPinned && (
                  <div className="absolute -top-2.5 -right-2.5 bg-amber-100 border border-amber-200 text-amber-600 rounded-full p-1.5 shadow-sm">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{note.user?.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mt-0.5">
                      <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {note.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
