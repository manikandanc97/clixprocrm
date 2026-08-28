"use client";

import React, { useState } from "react";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { SupportTicketForm } from "@/features/help-center/components/SupportTicketForm";
import { TicketHistoryList } from "@/features/help-center/components/TicketHistoryList";
import { DocumentationHub } from "@/features/help-center/components/DocumentationHub";
import { ReleaseNotesView } from "@/features/help-center/components/ReleaseNotesView";
import {
  LifeBuoy,
  BookOpen,
  Rocket,
  Ticket,
} from "lucide-react";

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState("ticket");

  return (
    <CRMPageContainer className="gap-5 pb-24 md:pb-8 lg:pb-10">
      {/* Page Header */}
      <CRMPageHeader
        title="Help & Support Desk"
        subtitle="Submit technical tickets, track resolution status, and browse interactive guides."
        icon={LifeBuoy}
        badge="Enterprise Desk"
      />

      {/* Command Center Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full overflow-x-auto pb-2 scrollbar-none shrink-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 sm:grid sm:grid-cols-4 max-w-3xl p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="ticket" className="text-xs font-semibold gap-1.5 py-2 px-3">
              <LifeBuoy className="w-3.5 h-3.5 text-primary" />
              <span>Raise Ticket</span>
            </TabsTrigger>

            <TabsTrigger value="history" className="text-xs font-semibold gap-1.5 py-2 px-3">
              <Ticket className="w-3.5 h-3.5 text-blue-500" />
              <span>My Tickets</span>
            </TabsTrigger>

            <TabsTrigger value="docs" className="text-xs font-semibold gap-1.5 py-2 px-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Documentation</span>
            </TabsTrigger>

            <TabsTrigger value="release" className="text-xs font-semibold gap-1.5 py-2 px-3">
              <Rocket className="w-3.5 h-3.5 text-amber-500" />
              <span>Release Notes</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Raise Ticket */}
        <TabsContent value="ticket" className="mt-4 focus-visible:outline-none flex-1">
          <SupportTicketForm
            onSwitchToHistory={() => setActiveTab("history")}
          />
        </TabsContent>

        {/* Tab 2: My Tickets */}
        <TabsContent value="history" className="mt-4 focus-visible:outline-none flex-1">
          <TicketHistoryList
            onNewTicketClick={() => setActiveTab("ticket")}
          />
        </TabsContent>

        {/* Tab 3: Documentation */}
        <TabsContent value="docs" className="mt-4 focus-visible:outline-none flex-1">
          <DocumentationHub />
        </TabsContent>

        {/* Tab 4: Release Notes */}
        <TabsContent value="release" className="mt-4 focus-visible:outline-none flex-1">
          <ReleaseNotesView />
        </TabsContent>
      </Tabs>
    </CRMPageContainer>
  );
}

