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
  friendlyLabel: string;
  description?: string;
  badge?: string;
  badgeInfo?: string;
  isLocked?: boolean;
  requiredPlan?: string;
  reasoningEffort?: 'standard' | 'high' | 'deep';
  hasSubmenu?: boolean;
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
