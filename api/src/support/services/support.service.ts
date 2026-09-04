import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { StorageService } from '../../common/services/storage.service';
import { EmailQueueProducer } from '../../queue/producers/email-queue.producer';
import { SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';


export interface SupportTicketRecord {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  tenantId?: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  description: string;
  diagnostics: any;
  attachments: { filename: string; size: number; contentType?: string; url?: string }[];
  estimatedResponseTime: string;
  createdAt: string;
  updatedAt: string;
  replies: Array<{
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
    isInternal?: boolean;
  }>;
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function mapPriorityToEnum(priority: string): SupportTicketPriority {
  const norm = String(priority || '').toUpperCase();
  if (norm === 'CRITICAL') return SupportTicketPriority.CRITICAL;
  if (norm === 'HIGH') return SupportTicketPriority.HIGH;
  if (norm === 'LOW') return SupportTicketPriority.LOW;
  return SupportTicketPriority.MEDIUM;
}

export function mapEnumToPriority(priority: SupportTicketPriority): 'Low' | 'Medium' | 'High' | 'Critical' {
  switch (priority) {
    case SupportTicketPriority.CRITICAL: return 'Critical';
    case SupportTicketPriority.HIGH: return 'High';
    case SupportTicketPriority.LOW: return 'Low';
    default: return 'Medium';
  }
}

export function extractRoleString(roleInput: any): string {
  if (!roleInput) return '';
  if (typeof roleInput === 'string') return roleInput;
  if (typeof roleInput === 'object') {
    return roleInput.name || roleInput.role || roleInput.title || '';
  }
  return String(roleInput);
}

export function formatTicketOutput(ticket: any, includeInternal = false): SupportTicketRecord {
  const replies = (ticket.messages || [])
    .filter((m: any) => includeInternal || !m.isInternal)
    .map((m: any) => ({
      id: m.id,
      author: m.sender?.name || m.sender?.email || (m.isStaff ? 'ClixPro Support Staff' : 'Customer'),
      authorRole: m.isStaff ? ('Support Engineer' as const) : ('Client' as const),
      message: m.message,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      isStaff: m.isStaff,
      isInternal: m.isInternal || false,
    }));

  const attachments = (ticket.attachments || []).map((a: any) => ({
    filename: a.fileName,
    size: a.fileSize,
    contentType: a.fileType,
    url: a.fileUrl,
  }));

  return {
    id: ticket.id,
    ticketId: ticket.ticketNumber,
    userId: ticket.createdById || ticket.createdBy?.id || 'anonymous',
    userEmail: ticket.createdBy?.email || 'support@clixprocrm.com',
    userName: ticket.createdBy?.name || 'Workspace Member',
    tenantId: ticket.tenantId,
    subject: ticket.subject,
    category: ticket.category,
    priority: mapEnumToPriority(ticket.priority),
    status: ticket.status as any,
    description: ticket.description,
    diagnostics: ticket.diagnostics,
    attachments,
    estimatedResponseTime: ticket.estimatedResponseTime || 'Within 24 Hours',
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : String(ticket.createdAt),
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : String(ticket.updatedAt),
    replies,
  };
}

function formatTicketSummary(ticket: any): SupportTicketRecord {
  return {
    id: ticket.id,
    ticketId: ticket.ticketNumber,
    userId: ticket.createdById || '',
    userEmail: ticket.createdBy?.email || 'support@clixprocrm.com',
    userName: ticket.createdBy?.name || 'Workspace Member',
    tenantId: ticket.tenantId,
    subject: ticket.subject,
    category: ticket.category,
    priority: mapEnumToPriority(ticket.priority),
    status: ticket.status,
    description: ticket.description,
    diagnostics: ticket.diagnostics,
    attachments: (ticket.attachments || []).map((a: any) => ({
      filename: a.fileName,
      size: a.fileSize,
      contentType: a.fileType,
    })),
    estimatedResponseTime: ticket.estimatedResponseTime || 'Within 24 Hours',
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : String(ticket.createdAt),
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : String(ticket.updatedAt),
    replies: [],
  };
}


@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly storageService?: StorageService,
    @Optional() private readonly emailQueueProducer?: EmailQueueProducer,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendSupportTicket(
    subject: string,
    category: string,
    priority: 'Low' | 'Medium' | 'High' | 'Critical' | string,
    description: string,
    diagnostics: any,
    attachments: { filename: string; content: Buffer; contentType?: string }[],
    authenticatedContext?: { userId: string; tenantId: string; userEmail?: string; userName?: string },
  ) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const ticketId = `CP-SUP-${year}-${randomNum}`;

    let estimatedResponseTime = 'Within 24 hours';
    if (priority === 'Critical') estimatedResponseTime = '< 1 Hour (Priority Escalation)';
    else if (priority === 'High') estimatedResponseTime = '< 4 Hours';
    else if (priority === 'Medium') estimatedResponseTime = '< 12 Hours';
    else estimatedResponseTime = 'Within 24 Hours';

    const userId = authenticatedContext?.userId || diagnostics?.userId || 'system';
    const userEmail = authenticatedContext?.userEmail || diagnostics?.email || 'support@clixprocrm.com';
    const userName = authenticatedContext?.userName || diagnostics?.currentUserName || 'Workspace Member';
    const tenantId = authenticatedContext?.tenantId || diagnostics?.tenantId;

    const mappedPriority = mapPriorityToEnum(priority);
    let createdRecord: SupportTicketRecord;

    if (this.prisma && tenantId && userId && userId !== 'system') {
      // 1. Upload attachments to Supabase Storage if storageService is available
      const uploadedAttachments: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        fileType: string;
        storagePath?: string;
      }> = [];

      if (this.storageService && attachments.length > 0) {
        for (const att of attachments) {
          try {
            const uploaded = await this.storageService.uploadAttachment(
              tenantId,
              'support-tickets',
              att.content,
              att.filename,
              att.contentType || 'application/octet-stream',
            );
            uploadedAttachments.push({
              fileName: uploaded.fileName,
              fileUrl: uploaded.storageUrl,
              fileSize: uploaded.fileSize,
              fileType: uploaded.fileType,
              storagePath: uploaded.storagePath,
            });
          } catch (uploadErr: any) {
            this.logger.warn(`Storage upload warning for ${att.filename}: ${uploadErr?.message || uploadErr}`);
            uploadedAttachments.push({
              fileName: att.filename,
              fileUrl: '',
              fileSize: att.content.length,
              fileType: att.contentType || 'application/octet-stream',
            });
          }
        }
      } else {
        for (const att of attachments) {
          uploadedAttachments.push({
            fileName: att.filename,
            fileUrl: '',
            fileSize: att.content.length,
            fileType: att.contentType || 'application/octet-stream',
          });
        }
      }

      // 2. Transact SupportTicket, initial Message, and Attachments in DB with tenant isolation
      const dbTicket = await this.prisma.withTenantContext(
        { tenantId, userId },
        async (tx) => {
          return tx.supportTicket.create({
            data: {
              ticketNumber: ticketId,
              tenantId,
              createdById: userId,
              subject,
              category: category || 'General',
              priority: mappedPriority,
              status: SupportTicketStatus.OPEN,
              description,
              diagnostics: diagnostics || {},
              estimatedResponseTime,
              messages: {
                create: {
                  senderId: userId,
                  message: description,
                  isStaff: false,
                  isInternal: false,
                },
              },
              attachments: {
                create: uploadedAttachments.map((a) => ({
                  fileName: a.fileName,
                  fileUrl: a.fileUrl || '',
                  fileSize: a.fileSize,
                  fileType: a.fileType,
                  storagePath: a.storagePath,
                })),
              },
            },
            include: {
              createdBy: { select: { id: true, name: true, email: true, avatar: true } },
              attachments: true,
              messages: {
                include: {
                  sender: { select: { id: true, name: true, email: true, avatar: true } },
                },
              },
            },
          });
        },
      );

      createdRecord = formatTicketOutput(dbTicket);

      // 3. Create Cryptographically Sealed Audit Log
      try {
        await this.prisma.createSealedAuditLog({
          tenantId,
          userId,
          action: 'SUPPORT_TICKET_CREATED',
          module: 'SupportDesk',
          details: {
            ticketId: dbTicket.id,
            ticketNumber: ticketId,
            subject,
            category,
            priority,
            attachmentsCount: attachments.length,
          },
        });
      } catch (auditErr: any) {
        this.logger.warn(`Failed to create sealed audit log for ticket ${ticketId}: ${auditErr?.message || auditErr}`);
      }

      // 4. Notify all active Super Admins via existing Notification model & Supabase Realtime
      if (this.notificationsService) {
        try {
          const superAdmins = await this.prisma.user.findMany({
            where: { isSuperAdmin: true, status: 'ACTIVE' },
            select: { id: true },
          });

          for (const admin of superAdmins) {
            await this.notificationsService.createNotification(
              tenantId,
              admin.id,
              `New Support Ticket #${ticketId}`,
              `${userName} (${category}): ${subject.slice(0, 100)}`,
              'support',
            );
          }
        } catch (notifErr: any) {
          this.logger.warn(`Failed to dispatch Super Admin notification for ticket ${ticketId}: ${notifErr?.message || notifErr}`);
        }
      }
    } else {
      // Fallback for tests or disconnected environments
      createdRecord = {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ticketId,
        userId,
        userEmail,
        userName,
        tenantId,
        subject,
        category: category || 'General',
        priority: mapEnumToPriority(mappedPriority),
        status: 'OPEN',
        description,
        diagnostics,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          size: a.content.length,
          contentType: a.contentType,
        })),
        estimatedResponseTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [
          {
            id: `rep_${Date.now()}`,
            author: userName,
            authorRole: 'Client',
            message: description,
            createdAt: new Date().toISOString(),
            isStaff: false,
          },
        ],
      };
    }

    // 5. Send support notification email (Enqueues to BullMQ crm-email-queue with fallback)
    if (this.emailQueueProducer && this.emailQueueProducer.isQueueAvailable()) {
      try {
        await this.emailQueueProducer.enqueueSupportTicketEmail({
          tenantId: tenantId || 'system',
          userId: userId || 'system',
          ticketId,
          subject,
          category,
          priority,
          description,
          diagnostics,
          userEmail,
          userName,
          attachmentsCount: attachments.length,
        });
        return { ticketId, estimatedResponseTime, ticket: createdRecord };
      } catch (queueErr: any) {
        this.logger.warn(
          `Failed to enqueue support ticket email for ${ticketId}, attempting direct send: ${queueErr?.message || queueErr}`,
        );
      }
    }

    const safeSubject = escapeHtml(subject);
    const safeCategory = escapeHtml(category);
    const safePriority = escapeHtml(priority);
    const safeDescription = escapeHtml(description);

    const safeDiagnostics = {
      currentUserName: escapeHtml(diagnostics?.currentUserName || userName || 'N/A'),
      email: escapeHtml(diagnostics?.email || userEmail || 'N/A'),
      userId: escapeHtml(diagnostics?.userId || userId || 'N/A'),
      role: escapeHtml(diagnostics?.role || 'N/A'),
      currentUrl: escapeHtml(diagnostics?.currentUrl || 'N/A'),
      browser: escapeHtml(diagnostics?.browser || 'N/A'),
      operatingSystem: escapeHtml(diagnostics?.operatingSystem || 'N/A'),
      deviceType: escapeHtml(diagnostics?.deviceType || 'N/A'),
      screenResolution: escapeHtml(diagnostics?.screenResolution || 'N/A'),
      timezone: escapeHtml(diagnostics?.timezone || 'N/A'),
      appVersion: escapeHtml(diagnostics?.appVersion || 'N/A'),
      timestamp: escapeHtml(diagnostics?.timestamp || new Date().toISOString()),
    };

    const priorityColor =
      priority === 'Critical'
        ? '#ef4444'
        : priority === 'High'
          ? '#f97316'
          : priority === 'Medium'
            ? '#eab308'
            : '#10b981';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Clixpro CRM Support Ticket</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Category:</strong> ${safeCategory}</p>
          <p><strong>Priority:</strong> <span style="background-color: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${safePriority}</span></p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 4px; white-space: pre-wrap;">
            <strong>Description:</strong><br/>
            ${safeDescription}
          </div>
          
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">User & System Diagnostics</h3>
          <table style="width: 100%; font-size: 13px; text-align: left; border-collapse: collapse;">
            <tbody>
              <tr><th style="padding: 4px;">User Name:</th><td>${safeDiagnostics.currentUserName}</td></tr>
              <tr><th style="padding: 4px;">Email:</th><td>${safeDiagnostics.email}</td></tr>
              <tr><th style="padding: 4px;">User ID:</th><td>${safeDiagnostics.userId}</td></tr>
              <tr><th style="padding: 4px;">Role:</th><td>${safeDiagnostics.role}</td></tr>
              <tr><th style="padding: 4px;">Current URL:</th><td>${safeDiagnostics.currentUrl}</td></tr>
              <tr><th style="padding: 4px;">Browser:</th><td>${safeDiagnostics.browser}</td></tr>
              <tr><th style="padding: 4px;">OS:</th><td>${safeDiagnostics.operatingSystem}</td></tr>
              <tr><th style="padding: 4px;">Device:</th><td>${safeDiagnostics.deviceType}</td></tr>
              <tr><th style="padding: 4px;">Resolution:</th><td>${safeDiagnostics.screenResolution}</td></tr>
              <tr><th style="padding: 4px;">Timezone:</th><td>${safeDiagnostics.timezone}</td></tr>
              <tr><th style="padding: 4px;">App Version:</th><td>${safeDiagnostics.appVersion}</td></tr>
              <tr><th style="padding: 4px;">Submitted At:</th><td>${safeDiagnostics.timestamp}</td></tr>
            </tbody>
          </table>
          
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
            <em>Attachments: ${attachments.length} files included.</em>
          </p>
        </div>
      </div>
    `;

    const supportRecipient = process.env.SUPPORT_EMAIL || 'support@clixprocrm.com';

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await this.transporter.sendMail({
          from: `"Clixpro Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: supportRecipient,
          subject: `[ClixProCRM Support] #${ticketId} - ${subject.slice(0, 80)}`,
          html: htmlContent,
          attachments,
        });
      } catch (mailError: any) {
        this.logger.error(
          `Failed to deliver support email for ticket ${ticketId}: ${mailError?.message || mailError}`,
        );
      }
    } else {
      this.logger.warn('SMTP configuration not found, skipping email dispatch.');
    }

    return { ticketId, estimatedResponseTime, ticket: createdRecord };
  }

  async getUserTickets(userId: string, tenantId?: string): Promise<SupportTicketRecord[]> {
    if (this.prisma && tenantId) {
      const tickets = await this.prisma.withTenantContext(
        { tenantId, userId },
        async (tx) => {
          return tx.supportTicket.findMany({
            where: {
              tenantId,
              createdById: userId,
            },
            include: {
              createdBy: { select: { id: true, name: true, email: true, avatar: true } },
              assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
              attachments: true,
              messages: {
                where: { isInternal: false }, // Internal notes strictly hidden from regular user
                orderBy: { createdAt: 'asc' },
                include: {
                  sender: { select: { id: true, name: true, email: true, avatar: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
        },
      );
      return tickets.map((t) => formatTicketOutput(t));
    }
    return [];
  }

  async getTicketById(
    ticketId: string,
    userId: string,
    tenantId?: string,
  ): Promise<SupportTicketRecord | null> {
    if (this.prisma && tenantId) {
      const ticket = await this.prisma.withTenantContext(
        { tenantId, userId },
        async (tx) => {
          return tx.supportTicket.findFirst({
            where: {
              tenantId,
              createdById: userId,
              OR: [{ id: ticketId }, { ticketNumber: ticketId }],
            },
            include: {
              createdBy: { select: { id: true, name: true, email: true, avatar: true } },
              assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
              attachments: true,
              messages: {
                where: { isInternal: false }, // Internal notes strictly hidden
                orderBy: { createdAt: 'asc' },
                include: {
                  sender: { select: { id: true, name: true, email: true, avatar: true } },
                },
              },
            },
          });
        },
      );
      if (!ticket) return null;
      return formatTicketOutput(ticket);
    }
    return null;
  }

  async addReplyToTicket(
    ticketId: string,
    userId: string,
    userName: string,
    message: string,
    tenantId?: string,
  ): Promise<SupportTicketRecord | null> {
    if (!this.prisma || !tenantId) {
      throw new BadRequestException('Database tenant context required to add reply');
    }

    return this.prisma.withTenantContext(
      { tenantId, userId },
      async (tx) => {
        const ticket = await tx.supportTicket.findFirst({
          where: {
            tenantId,
            createdById: userId,
            OR: [{ id: ticketId }, { ticketNumber: ticketId }],
          },
        });

        if (!ticket) {
          throw new NotFoundException('Support ticket not found or access denied');
        }

        // Add message
        await tx.supportTicketMessage.create({
          data: {
            ticketId: ticket.id,
            senderId: userId,
            message: message.trim(),
            isStaff: false,
            isInternal: false,
          },
        });

        // If status was WAITING_FOR_USER or RESOLVED, move back to IN_PROGRESS
        const newStatus =
          ticket.status === SupportTicketStatus.WAITING_FOR_USER ||
          ticket.status === SupportTicketStatus.RESOLVED
            ? SupportTicketStatus.IN_PROGRESS
            : ticket.status;

        const updated = await tx.supportTicket.update({
          where: { id: ticket.id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
            attachments: true,
            messages: {
              where: { isInternal: false },
              orderBy: { createdAt: 'asc' },
              include: {
                sender: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        });

        // Notify assigned agent or Super Admins
        if (this.notificationsService) {
          const recipientId = ticket.assignedToId;
          if (recipientId) {
            await this.notificationsService.createNotification(
              tenantId,
              recipientId,
              `New Reply on #${ticket.ticketNumber}`,
              `${userName}: ${message.slice(0, 100)}`,
              'support',
            ).catch(() => {});
          } else {
            const superAdmins = await tx.user.findMany({
              where: { isSuperAdmin: true, status: 'ACTIVE' },
              select: { id: true },
            });
            for (const sa of superAdmins) {
              await this.notificationsService.createNotification(
                tenantId,
                sa.id,
                `New Reply on #${ticket.ticketNumber}`,
                `${userName}: ${message.slice(0, 100)}`,
                'support',
              ).catch(() => {});
            }
          }
        }

        return formatTicketOutput(updated);
      },
    );
  }

  async updateTicket(
    ticketId: string,
    userId: string,
    updateData: {
      subject?: string;
      description?: string;
      category?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
    },
    tenantId?: string,
    userRole?: any,
    isSuperAdmin = false,
  ): Promise<SupportTicketRecord> {
    if (!this.prisma) {
      throw new BadRequestException('Database service required');
    }

    const contextTenantId = tenantId || (isSuperAdmin ? undefined : undefined);

    return this.prisma.withTenantContext(
      { tenantId: contextTenantId, userId, isSuperAdmin },
      async (tx) => {
        const ticketWhere: any = {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        };
        if (tenantId && !isSuperAdmin) {
          ticketWhere.tenantId = tenantId;
        }

        const ticket = await tx.supportTicket.findFirst({
          where: ticketWhere,
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        });

        if (!ticket) {
          throw new NotFoundException('Support ticket not found');
        }

        const isOwner = ticket.createdById === userId;
        const normalizedRole = extractRoleString(userRole).toUpperCase();
        const isAdmin =
          isSuperAdmin ||
          normalizedRole === 'ADMIN' ||
          normalizedRole === 'SUPERADMIN' ||
          normalizedRole === 'SUPER_ADMIN' ||
          normalizedRole === 'OWNER' ||
          normalizedRole === 'ORG_OWNER';

        if (!isOwner && !isAdmin) {
          throw new ForbiddenException('You are only authorized to edit tickets that you submitted');
        }

        if (ticket.status === SupportTicketStatus.CLOSED && !isAdmin) {
          throw new BadRequestException('Closed tickets cannot be edited. Please post a reply or open a new ticket.');
        }

        const updatePayload: any = {
          updatedAt: new Date(),
        };

        if (updateData.subject && updateData.subject.trim()) {
          updatePayload.subject = updateData.subject.trim();
        }
        if (updateData.category && updateData.category.trim()) {
          updatePayload.category = updateData.category.trim();
        }
        if (updateData.priority) {
          updatePayload.priority = mapPriorityToEnum(updateData.priority);
        }
        if (updateData.status) {
          updatePayload.status = updateData.status as SupportTicketStatus;
          if (updateData.status === 'RESOLVED' && !ticket.resolvedAt) {
            updatePayload.resolvedAt = new Date();
          }
          if (updateData.status === 'CLOSED' && !ticket.closedAt) {
            updatePayload.closedAt = new Date();
          }
        }
        if (updateData.description && updateData.description.trim()) {
          updatePayload.description = updateData.description.trim();

          // Keep initial description message in sync
          if (ticket.messages && ticket.messages.length > 0) {
            await tx.supportTicketMessage.update({
              where: { id: ticket.messages[0].id },
              data: { message: updateData.description.trim() },
            });
          }
        }

        const updated = await tx.supportTicket.update({
          where: { id: ticket.id },
          data: updatePayload,
          include: {
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
            attachments: true,
            messages: {
              where: { isInternal: false },
              orderBy: { createdAt: 'asc' },
              include: {
                sender: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        });

        // Audit log
        try {
          await this.prisma?.createSealedAuditLog({
            tenantId: ticket.tenantId,
            userId,
            action: 'SUPPORT_TICKET_UPDATED',
            module: 'SupportDesk',
            details: {
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              updatedFields: Object.keys(updatePayload),
            },
          });
        } catch (auditErr: any) {
          this.logger.warn(`Failed to create audit log for updated ticket: ${auditErr?.message || auditErr}`);
        }

        return formatTicketOutput(updated);
      },
    );
  }

  async deleteTicket(
    ticketId: string,
    userId: string,
    tenantId?: string,
    userRole?: any,
    isSuperAdmin = false,
  ): Promise<{ success: boolean; id: string; ticketNumber: string }> {
    if (!this.prisma) {
      throw new BadRequestException('Database service required');
    }

    const contextTenantId = tenantId || (isSuperAdmin ? undefined : undefined);

    return this.prisma.withTenantContext(
      { tenantId: contextTenantId, userId, isSuperAdmin },
      async (tx) => {
        const ticketWhere: any = {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        };
        if (tenantId && !isSuperAdmin) {
          ticketWhere.tenantId = tenantId;
        }

        const ticket = await tx.supportTicket.findFirst({
          where: ticketWhere,
          include: {
            attachments: true,
          },
        });

        if (!ticket) {
          throw new NotFoundException('Support ticket not found');
        }

        const isOwner = ticket.createdById === userId;
        const normalizedRole = extractRoleString(userRole).toUpperCase();
        const isAdmin =
          isSuperAdmin ||
          normalizedRole === 'ADMIN' ||
          normalizedRole === 'SUPERADMIN' ||
          normalizedRole === 'SUPER_ADMIN' ||
          normalizedRole === 'OWNER' ||
          normalizedRole === 'ORG_OWNER';

        if (!isOwner && !isAdmin) {
          throw new ForbiddenException('You are only authorized to delete tickets that you submitted');
        }

        // Clean up storage attachments if storage service is active
        if (this.storageService && ticket.attachments && ticket.attachments.length > 0) {
          for (const att of ticket.attachments) {
            if (att.storagePath) {
              await this.storageService.deleteAttachment(att.storagePath).catch(() => {});
            }
          }
        }

        // 1. Explicitly delete child messages & attachments first to prevent RLS cascade conflicts
        await tx.supportTicketMessage.deleteMany({
          where: { ticketId: ticket.id },
        });
        await tx.supportTicketAttachment.deleteMany({
          where: { ticketId: ticket.id },
        });

        // 2. Delete ticket record
        await tx.supportTicket.delete({
          where: { id: ticket.id },
        });

        // 3. Sealed audit log
        try {
          await this.prisma?.createSealedAuditLog({
            tenantId: ticket.tenantId,
            userId,
            action: 'SUPPORT_TICKET_DELETED',
            module: 'SupportDesk',
            details: {
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
            },
          });
        } catch (auditErr: any) {
          this.logger.warn(`Failed to create audit log for deleted ticket: ${auditErr?.message || auditErr}`);
        }

        return {
          success: true,
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
        };
      },
    );
  }

  getSystemStatus() {
    return {
      status: 'OPERATIONAL',
      version: '1.2.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      smtpService: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
        ? 'CONFIGURED'
        : 'LOCAL_LOG_ONLY',
      serverLoad: 'HEALTHY',
    };
  }
}
