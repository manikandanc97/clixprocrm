import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';

const DEFAULT_AI_FEATURES = [
  {
    id: 'f1',
    label: 'Enable AI',
    description: 'Activate AI assistant across the platform',
    enabled: true,
  },
  {
    id: 'f2',
    label: 'Smart Reply',
    description: 'AI generated email responses',
    enabled: true,
  },
  {
    id: 'f3',
    label: 'Lead Scoring',
    description: 'Predict likelihood to close',
    enabled: true,
  },
  {
    id: 'f4',
    label: 'Meeting Summary',
    description: 'Auto-generate notes from meetings',
    enabled: false,
  },
  {
    id: 'f5',
    label: 'Email Draft',
    description: 'Draft outbound sales emails',
    enabled: true,
  },
  {
    id: 'f6',
    label: 'Task Suggestions',
    description: 'Suggest next best actions',
    enabled: false,
  },
  {
    id: 'f7',
    label: 'Knowledge Base',
    description: 'Answer support questions automatically',
    enabled: true,
  },
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  async getAiSettings(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const config = await tx.tenantAiConfig.findUnique({
        where: { tenantId },
      });

      const isAiEnabled = config ? config.isAiEnabled : true;
      const useRag = config ? config.useRag : true;
      const useTools = config ? config.useTools : true;

      const features = DEFAULT_AI_FEATURES.map((f) => {
        if (f.id === 'f1') return { ...f, enabled: isAiEnabled };
        if (f.id === 'f7') return { ...f, enabled: useRag };
        return { ...f };
      });

      return {
        features,
        modules: [],
        controls: [],
        provider: config?.provider || 'gemini',
        model: config?.model || 'gemini-1.5-flash',
        temperature: config?.temperature ?? 0.7,
        isAiEnabled,
        useRag,
        useTools,
        hasCustomApiKey: Boolean(config?.apiKey),
        apiKeyMasked: config?.apiKey ? '••••••••••••••••' : null,
      };
    });
  }

  async updateAiSettings(tenantId: string, data: any) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      let isAiEnabled: boolean | undefined = undefined;
      let useRag: boolean | undefined = undefined;

      if (Array.isArray(data.features)) {
        const f1 = data.features.find((f: any) => f.id === 'f1');
        if (f1 && typeof f1.enabled === 'boolean') {
          isAiEnabled = f1.enabled;
        }
        const f7 = data.features.find((f: any) => f.id === 'f7');
        if (f7 && typeof f7.enabled === 'boolean') {
          useRag = f7.enabled;
        }
      }

      if (typeof data.isAiEnabled === 'boolean') {
        isAiEnabled = data.isAiEnabled;
      }
      if (typeof data.useRag === 'boolean') {
        useRag = data.useRag;
      }

      const updatePayload: any = {};
      if (isAiEnabled !== undefined) updatePayload.isAiEnabled = isAiEnabled;
      if (useRag !== undefined) updatePayload.useRag = useRag;
      if (data.model) updatePayload.model = String(data.model);
      if (typeof data.temperature === 'number') updatePayload.temperature = data.temperature;

      // Handle Bring-Your-Own-Key API Key Encryption
      if (data.apiKey !== undefined) {
        if (typeof data.apiKey === 'string' && data.apiKey.trim().length > 0 && !data.apiKey.includes('••••')) {
          updatePayload.apiKey = this.enc.encrypt(data.apiKey.trim());
        } else if (data.apiKey === null || data.apiKey === '') {
          updatePayload.apiKey = null;
        }
      }

      await tx.tenantAiConfig.upsert({
        where: { tenantId },
        update: updatePayload,
        create: {
          tenantId,
          provider: data.provider || 'gemini',
          model: data.model || 'gemini-1.5-flash',
          temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
          isAiEnabled: isAiEnabled ?? true,
          useRag: useRag ?? true,
          useTools: true,
          ...(updatePayload.apiKey !== undefined ? { apiKey: updatePayload.apiKey } : {}),
        },
      });

      return this.getAiSettings(tenantId);
    });
  }

  async getNotificationSettings(tenantId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { notificationPrefs: true },
      });

      const DEFAULT_NOTIFICATION_PREFS = {
        emailAlerts: true,
        inAppAlerts: true,
        soundEnabled: true,
        browserPush: false,
        leadAssignment: true,
        dealUpdates: true,
        taskReminders: true,
        aiBriefing: true,
        invoiceAlerts: true,
        meetingAlerts: true,
        weeklyDigest: true,
        securityAlerts: true,
      };

      const saved = (user?.notificationPrefs as Record<string, any>) || {};
      const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...saved };

      return {
        ...prefs,
        channels: [
          { id: 'emailAlerts', name: 'Email Notifications', enabled: prefs.emailAlerts },
          { id: 'inAppAlerts', name: 'In-App Banner Alerts', enabled: prefs.inAppAlerts },
          { id: 'soundEnabled', name: 'Notification Sound Chime', enabled: prefs.soundEnabled },
          { id: 'browserPush', name: 'Desktop Push Notifications', enabled: prefs.browserPush },
        ],
        categories: [
          {
            id: 'activity',
            title: 'Activity & Event Alerts',
            notifications: [
              {
                id: 'leadAssignment',
                title: 'Lead Assignments & Imports',
                description: 'Alert immediately when a new lead is assigned to you or imported.',
                critical: false,
                enabled: prefs.leadAssignment,
              },
              {
                id: 'dealUpdates',
                title: 'Deal Stage Movements & Wins',
                description: 'Notify when monitored deals change stage or are marked Won/Lost.',
                critical: false,
                enabled: prefs.dealUpdates,
              },
              {
                id: 'taskReminders',
                title: 'Task Reminders & Overdue Alerts',
                description: 'Reminders 15 minutes before tasks and overdue escalation notices.',
                critical: false,
                enabled: prefs.taskReminders,
              },
              {
                id: 'invoiceAlerts',
                title: 'Quotations & Invoicing Updates',
                description: 'Alerts on quotation approvals and invoice payment settlements.',
                critical: false,
                enabled: prefs.invoiceAlerts,
              },
              {
                id: 'meetingAlerts',
                title: 'Meeting & Calendar Reminders',
                description: 'Notifications for upcoming team syncs and client demo reminders.',
                critical: false,
                enabled: prefs.meetingAlerts,
              },
              {
                id: 'aiBriefing',
                title: 'AI Daily Briefing & Insights',
                description: 'Receive daily AI summaries of top priorities and actionable deals.',
                critical: false,
                enabled: prefs.aiBriefing,
              },
              {
                id: 'securityAlerts',
                title: 'Security & Login Alerts',
                description: 'Instant notifications for new logins, password changes, and MFA events.',
                critical: true,
                enabled: prefs.securityAlerts,
              },
            ],
          },
        ],
      };
    });
  }

  async updateNotificationSettings(tenantId: string, userId: string, data: any) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { notificationPrefs: true },
      });

      const current = (user?.notificationPrefs as Record<string, any>) || {};
      const updatedPrefs = { ...current, ...data };

      await tx.user.update({
        where: { id: userId },
        data: { notificationPrefs: updatedPrefs },
      });

      return this.getNotificationSettings(tenantId, userId);
    });
  }
}

