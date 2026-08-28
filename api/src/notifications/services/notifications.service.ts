import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(tenantId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      let notifications = await tx.notification.findMany({
        where: { tenantId, userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          type: true,
        },
      });

      // Auto-seed initial enterprise activity notifications if completely empty
      if (notifications.length === 0) {
        const seedData = [
          {
            title: 'AI Daily Intelligence Briefing',
            message: '3 High-intent accounts flagged with >85% win probability. Priority follow-up suggested for TechCorp.',
            type: 'ai',
            isRead: false,
          },
          {
            title: 'New High-Value Lead Assigned',
            message: 'Priya Sharma (Director, TechCorp India) assigned to your active queue.',
            type: 'lead',
            isRead: false,
          },
          {
            title: 'Deal Advanced to Proposal Stage',
            message: 'Enterprise Cloud Migration moved to Negotiation & Proposal (Value: ₹18,50,000).',
            type: 'deal',
            isRead: false,
          },
          {
            title: 'Invoice Payment Received',
            message: 'Payment of ₹2,40,000 for Invoice INV-2026-004 confirmed via NEFT/RTGS.',
            type: 'invoice',
            isRead: true,
          },
          {
            title: 'Task Reminder: Contract Review',
            message: 'Review and sign the finalized Master Service Agreement before 5:00 PM today.',
            type: 'task',
            isRead: true,
          },
          {
            title: 'Security Session Verified',
            message: 'Authenticated session active with Multi-Factor Authentication enabled.',
            type: 'security',
            isRead: true,
          },
        ];

        await Promise.all(
          seedData.map((s) =>
            tx.notification.create({
              data: {
                tenantId,
                userId,
                title: s.title,
                message: s.message,
                type: s.type,
                isRead: s.isRead,
              },
            }),
          ),
        );

        notifications = await tx.notification.findMany({
          where: { tenantId, userId },
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            message: true,
            isRead: true,
            createdAt: true,
            type: true,
          },
        });
      }

      return {
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          description: n.message,
          read: n.isRead,
          time: n.createdAt
            ? n.createdAt.toISOString()
            : new Date().toISOString(),
          type: n.type.toLowerCase(),
        })),
      };
    });
  }

  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const notification = await tx.notification.findUnique({
        where: { id: notificationId },
      });

      if (
        !notification ||
        notification.tenantId !== tenantId ||
        notification.userId !== userId
      ) {
        throw new NotFoundException('Notification not found');
      }

      await tx.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return { success: true };
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      await tx.notification.updateMany({
        where: { tenantId, userId, isRead: false },
        data: { isRead: true },
      });

      return { success: true };
    });
  }

  async deleteNotification(tenantId: string, userId: string, notificationId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const notification = await tx.notification.findUnique({
        where: { id: notificationId },
      });

      if (
        !notification ||
        notification.tenantId !== tenantId ||
        notification.userId !== userId
      ) {
        throw new NotFoundException('Notification not found');
      }

      await tx.notification.delete({
        where: { id: notificationId },
      });

      return { success: true };
    });
  }

  async clearAllRead(tenantId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      await tx.notification.deleteMany({
        where: { tenantId, userId, isRead: true },
      });

      return { success: true };
    });
  }

  async createNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    type = 'INFO',
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.notification.create({
        data: {
          tenantId,
          userId,
          title,
          message,
          type,
        },
      });
    });
  }

  async createTestNotification(tenantId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const sampleTitles = [
        { title: 'New Deal Stage Update', message: 'Apex Software signed off on the technical assessment. Stage updated to Proposal.', type: 'deal' },
        { title: 'AI Recommendation Triggered', message: 'AI recommends scheduling a discovery follow-up with Rajesh Kumar based on recent email engagement.', type: 'ai' },
        { title: 'Task Due Reminder', message: 'Upcoming scheduled demonstration with Global Corp starts in 15 minutes.', type: 'task' },
      ];
      const sample = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];

      return tx.notification.create({
        data: {
          tenantId,
          userId,
          title: sample.title,
          message: sample.message,
          type: sample.type,
          isRead: false,
        },
      });
    });
  }
}

