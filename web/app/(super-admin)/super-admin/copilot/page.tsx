'use client';

import React from 'react';
import { useAIWorkspace } from '@/features/ai/hooks/use-ai-workspace';
import { AIWorkspaceShell } from '@/features/ai/components/AIWorkspaceShell';
import { SuperAdminTelemetryCard } from '@/features/ai/components/SuperAdminTelemetryCard';
import { Activity } from 'lucide-react';

export default function SuperAdminAiPage() {
  const workspace = useAIWorkspace();

  return (
    <AIWorkspaceShell
      workspace={workspace}
      customTranscriptPrefix={`# ClixProCRM Platform AI Analysis\nDate: ${new Date().toLocaleString()}`}
      secondaryTab={{
        id: 'telemetry',
        label: 'Telemetry',
        icon: <Activity className="w-3.5 h-3.5" />,
        badge: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />,
        renderContent: ({ sendMessage }) => (
          <div className="h-full overflow-y-auto p-4 animate-in fade-in-50 duration-150 space-y-4 kanban-board-scroll">
            <SuperAdminTelemetryCard onTriggerAnalysis={sendMessage} />
          </div>
        ),
      }}
    />
  );
}
