"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAIWorkspace } from '@/features/ai/hooks/use-ai-workspace';
import { AIWorkspaceShell } from '@/features/ai/components/AIWorkspaceShell';
import { AICrmContextPanel } from '@/features/ai/components/AICrmContextPanel';
import { AIContextualSettings } from '@/features/ai/components/AIContextualSettings';
import { Database } from 'lucide-react';

export default function AIWorkspacePage() {
  const searchParams = useSearchParams();
  const custParam = searchParams.get('customize');
  const [prevCustParam, setPrevCustParam] = useState(custParam);
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    () => custParam === 'true' || custParam === 'settings'
  );

  if (custParam !== prevCustParam) {
    setPrevCustParam(custParam);
    if (custParam === 'true' || custParam === 'settings') {
      setIsSettingsOpen(true);
    }
  }

  const workspace = useAIWorkspace();

  return (
    <AIWorkspaceShell
      workspace={workspace}
      onOpenSettings={() => setIsSettingsOpen(true)}
      secondaryTab={{
        id: 'context',
        label: 'Context',
        icon: <Database className="w-3.5 h-3.5" />,
        badge: workspace.activeContext ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        ) : undefined,
        renderContent: ({ isMobile, closeSidebar, sendMessage }) => (
          <div className="h-full animate-in fade-in-50 duration-150">
            <AICrmContextPanel
              activeContext={workspace.activeContext}
              onClearContext={workspace.clearContext}
              onSelectPrompt={sendMessage}
              onClose={closeSidebar}
              hideHeader={true}
            />
          </div>
        ),
      }}
    >
      <AIContextualSettings
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </AIWorkspaceShell>
  );
}
