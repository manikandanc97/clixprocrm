import { UIMessage } from '@ai-sdk/react';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  context?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
}

export interface ModelOption {
  modelKey: string;
  displayName: string;
  friendlyLabel: 'Auto' | 'Fast' | 'Advanced' | string;
  description?: string;
  badge?: string;
  isLocked?: boolean;
  requiredPlan?: string;
  reasoningEffort?: 'standard' | 'high' | 'deep';
}

export interface CrmContextData {
  name: string;
  type?: 'contact' | 'company' | 'deal' | 'task' | 'general';
  id?: string;
  metadata?: Record<string, string | number>;
}

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  prompt: string;
  iconName: string;
}

export interface ActionConfirmationData {
  toolName: string;
  actionDescription: string;
  proposedData: Record<string, any>;
  confirmedPrompt: string;
}
