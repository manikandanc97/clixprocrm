import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { StorageService } from '../../common/services/storage.service';
import { EmailQueueProducer } from '../../queue/producers/email-queue.producer';
import { SupportTicketStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';

import { SupportTicketRecord } from '../interfaces/support.interface';
import {
  escapeHtml,
  mapPriorityToEnum,
  mapEnumToPriority,
  extractRoleString,
  formatTicketOutput,
} from '../utils/support-mapper.util';
import {
  calculateEstimatedResponseTime,
  buildFallbackSupportTicket,
  buildSupportEmailHtml,
} from '../utils/support-template.util';

export type { SupportTicketRecord };
export {
  escapeHtml,
  mapPriorityToEnum,
  mapEnumToPriority,
  extractRoleString,
  formatTicketOutput,
};

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
    authenticatedContext?: {
      userId: string;
      tenantId: string;
      userEmail?: string;
      userName?: string;
    },
  ) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const ticketId = `CP-SUP-${year}-${randomNum}`;
    const estimatedResponseTime = calculateEstimatedResponseTime(priority);

    const userId =
      authenticatedContext?.userId || diagnostics?.userId || 'system';
    const userEmail =
      authenticatedContext?.userEmail ||
      diagnostics?.email ||
      'support@clixprocrm.com';
    const userName =
      authenticatedContext?.userName ||
      diagnostics?.currentUserName ||
      'Workspace Member';
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
            this.logger.warn(
              `Storage upload warning for ${att.filename}: ${uploadErr?.message || uploadErr}`,
            );
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
              createdBy: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              attachments: true,
              messages: {
                include: {
                  sender: {
                    select: { id: true, name: true, email: true, avatar: true },
                  },
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
        this.logger.warn(
          `Failed to create sealed audit log for ticket ${ticketId}: ${auditErr?.message || auditErr}`,
        );
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
          this.logger.warn(
            `Failed to dispatch Super Admin notification for ticket ${ticketId}: ${notifErr?.message || notifErr}`,
          );
        }
      }
    } else {
      // Fallback for tests or disconnected environments
      createdRecord = buildFallbackSupportTicket({
        ticketId,
        userId,
        userEmail,
        userName,
        tenantId,
        subject,
        category,
        priority,
        description,
        diagnostics,
        attachments,
        estimatedResponseTime,
      });
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

    const htmlContent = buildSupportEmailHtml({
      ticketId,
      subject,
      category,
      priority,
      description,
      diagnostics,
      userEmail,
      userName,
      userId,
      attachmentsCount: attachments.length,
    });

    const supportRecipient =
      process.env.SUPPORT_EMAIL || 'support@clixprocrm.com';

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
      this.logger.warn(
        'SMTP configuration not found, skipping email dispatch.',
      );
    }

    return { ticketId, estimatedResponseTime, ticket: createdRecord };
  }

  async getUserTickets(
    userId: string,
    tenantId?: string,
  ): Promise<SupportTicketRecord[]> {
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
              createdBy: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              assignedTo: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              attachments: true,
              messages: {
                where: { isInternal: false }, // Internal notes strictly hidden from regular user
                orderBy: { createdAt: 'asc' },
                include: {
                  sender: {
                    select: { id: true, name: true, email: true, avatar: true },
                  },
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
              createdBy: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              assignedTo: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              attachments: true,
              messages: {
                where: { isInternal: false }, // Internal notes strictly hidden
                orderBy: { createdAt: 'asc' },
                include: {
                  sender: {
                    select: { id: true, name: true, email: true, avatar: true },
                  },
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
      throw new BadRequestException(
        'Database tenant context required to add reply',
      );
    }

    return this.prisma.withTenantContext({ tenantId, userId }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          tenantId,
          createdById: userId,
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
      });

      if (!ticket) {
        throw new NotFoundException(
          'Support ticket not found or access denied',
        );
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
          createdBy: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          attachments: true,
          messages: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
      });

      // Notify assigned agent or Super Admins
      if (this.notificationsService) {
        const recipientId = ticket.assignedToId;
        if (recipientId) {
          await this.notificationsService
            .createNotification(
              tenantId,
              recipientId,
              `New Reply on #${ticket.ticketNumber}`,
              `${userName}: ${message.slice(0, 100)}`,
              'support',
            )
            .catch(() => {});
        } else {
          const superAdmins = await tx.user.findMany({
            where: { isSuperAdmin: true, status: 'ACTIVE' },
            select: { id: true },
          });
          for (const sa of superAdmins) {
            await this.notificationsService
              .createNotification(
                tenantId,
                sa.id,
                `New Reply on #${ticket.ticketNumber}`,
                `${userName}: ${message.slice(0, 100)}`,
                'support',
              )
              .catch(() => {});
          }
        }
      }

      return formatTicketOutput(updated);
    });
  }

  async updateTicket(
    ticketId: string,
    userId: string,
    updateData: {
      subject?: string;
      description?: string;
      category?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?:
        'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
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
          throw new ForbiddenException(
            'You are only authorized to edit tickets that you submitted',
          );
        }

        if (ticket.status === SupportTicketStatus.CLOSED && !isAdmin) {
          throw new BadRequestException(
            'Closed tickets cannot be edited. Please post a reply or open a new ticket.',
          );
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
          updatePayload.status = updateData.status;
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
            createdBy: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            attachments: true,
            messages: {
              where: { isInternal: false },
              orderBy: { createdAt: 'asc' },
              include: {
                sender: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
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
          this.logger.warn(
            `Failed to create audit log for updated ticket: ${auditErr?.message || auditErr}`,
          );
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
          throw new ForbiddenException(
            'You are only authorized to delete tickets that you submitted',
          );
        }

        // Clean up storage attachments if storage service is active
        if (
          this.storageService &&
          ticket.attachments &&
          ticket.attachments.length > 0
        ) {
          for (const att of ticket.attachments) {
            if (att.storagePath) {
              await this.storageService
                .deleteAttachment(att.storagePath)
                .catch(() => {});
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
          this.logger.warn(
            `Failed to create audit log for deleted ticket: ${auditErr?.message || auditErr}`,
          );
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
      smtpService:
        process.env.SMTP_HOST && process.env.SMTP_USER
          ? 'CONFIGURED'
          : 'LOCAL_LOG_ONLY',
      serverLoad: 'HEALTHY',
    };
  }
}
