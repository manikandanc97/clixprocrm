import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { MessageSquare, Calendar, Clock, Paperclip } from "lucide-react";
import { useCRMStore } from "@/shared/store/useCRMStore";

import { NotesTab } from "./tabs/NotesTab";
import { MeetingsTab } from "./tabs/MeetingsTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";

interface LeadDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  defaultTab?: string;
}

export function LeadDetailsDrawer({ isOpen, onOpenChange, leadId, defaultTab = "notes" }: LeadDetailsDrawerProps) {
  const { leads } = useCRMStore();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const lead = leads.find(l => l.id === leadId);

  // Update active tab when defaultTab changes or modal opens
  React.useEffect(() => {
    if (isOpen) { (() => setActiveTab(defaultTab))(); }
  }, [isOpen, defaultTab]);

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        
        <DialogHeader className="px-6 py-5 border-b border-border flex flex-col items-start bg-muted/20 m-0">
          <div className="flex items-center gap-3 w-full pr-6">
            <Avatar className="w-10 h-10 border shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {lead.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-base font-bold m-0">{lead.name}</DialogTitle>
              <DialogDescription className="sr-only">
                Detailed view and activity history for {lead.name}
              </DialogDescription>
              <span className="text-xs text-muted-foreground font-medium">{lead.company}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-6 pt-2 border-b border-border bg-background sticky top-0 z-10">
              <TabsList className="w-full flex justify-start bg-transparent p-0 rounded-none h-auto gap-4 overflow-x-auto border-none no-scrollbar">
                <TabsTrigger value="notes" className="rounded-none text-xs font-bold py-3 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground bg-transparent shadow-none gap-1.5 flex items-center">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes
                </TabsTrigger>
                <TabsTrigger value="meetings" className="rounded-none text-xs font-bold py-3 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground bg-transparent shadow-none gap-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5" /> Meetings
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-none text-xs font-bold py-3 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground bg-transparent shadow-none gap-1.5 flex items-center">
                  <Clock className="w-3.5 h-3.5" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="attachments" className="rounded-none text-xs font-bold py-3 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground bg-transparent shadow-none gap-1.5 flex items-center">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </TabsTrigger>

              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="notes" className="mt-0 outline-none">
                <NotesTab leadId={lead.id} />
              </TabsContent>

              <TabsContent value="meetings" className="mt-0 outline-none">
                <MeetingsTab leadId={lead.id} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 outline-none">
                <TimelineTab leadId={lead.id} />
              </TabsContent>
              
              <TabsContent value="attachments" className="mt-0 outline-none">
                <AttachmentsTab leadId={lead.id} />
              </TabsContent>


            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
