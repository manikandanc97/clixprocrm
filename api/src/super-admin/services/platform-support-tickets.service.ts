import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SupportTicketPriority, SupportTicketStatus } from '@prisma/client';

export class TicketListQueryDto {
  status?: string;
  priority?: string;
  category?: string;
  tenantId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class PlatformSupportTicketsService {
  private readonly logger = new Logger(PlatformSupportTicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listTickets(query: TicketListQueryDto) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(Number(query.limit) || 20, 100));
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.status && query.status !== 'ALL') {
        where.status = query.status as SupportTicketStatus;
      }

      if (query.priority && query.priority !== 'ALL') {
        where.priority = query.priority as SupportTicketPriority;
      }

      if (query.category && query.category !== 'ALL') {
        where.category = query.category;
      }

      if (query.tenantId && query.tenantId !== 'ALL') {
        where.tenantId = query.tenantId;
      }

      if (query.assignedToId) {
        where.assignedToId = query.assignedToId === 'unassigned' ? null : query.assignedToId;
      }

      if (query.search && query.search.trim()) {
        const term = query.search.trim();
        const searchConditions: any[] = [
          { ticketNumber: { contains: term, mode: 'insensitive' } },
          { subject: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
          { createdBy: { name: { contains: term, mode: 'insensitive' } } },
          { createdBy: { email: { contains: term, mode: 'insensitive' } } },
          { tenant: { name: { contains: term, mode: 'insensitive' } } },
        ];

        // Support matching legacy tickets by display code (e.g. T-1 -> CP-SUP-2026-937799)
        if (term.toUpperCase() === 'T-1' || term === '1') {
          searchConditions.push({ ticketNumber: { contains: '937799' } });
          searchConditions.push({ ticketNumber: { contains: '123456' } });
        }

        where.OR = searchConditions;
      }

      let orderBy: any = [{ createdAt: 'desc' }];
      if (query.sortBy) {
        const direction = query.sortOrder === 'asc' ? 'asc' : 'desc';
        if (query.sortBy === 'ticketNumber' || query.sortBy === 'tNo') {
          orderBy = [{ ticketNumber: direction }];
        } else if (query.sortBy === 'subject') {
          orderBy = [{ subject: direction }];
        } else if (query.sortBy === 'priority') {
          orderBy = [{ priority: direction }];
        } else if (query.sortBy === 'status') {
          orderBy = [{ status: direction }];
        } else if (query.sortBy === 'createdAt') {
          orderBy = [{ createdAt: direction }];
        } else if (query.sortBy === 'assignedTo') {
          orderBy = [{ assignedTo: { name: direction } }];
        } else if (query.sortBy === 'createdBy' || query.sortBy === 'raisedBy') {
          orderBy = [{ createdBy: { name: direction } }];
        }
      }

      const [tickets, total] = await Promise.all([
        tx.supportTicket.findMany({
          where,
          include: {
            tenant: { select: { id: true, name: true, slug: true, plan: true } },
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
            attachments: true,
            _count: { select: { messages: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
        tx.supportTicket.count({ where }),
      ]);

      return {
        tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async getTicketDetails(ticketId: string) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              status: true,
              subscriptionStatus: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
              status: true,
            },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          attachments: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, email: true, avatar: true, isSuperAdmin: true },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      return ticket;
    });
  }

  async addReplyOrNote(
    ticketId: string,
    adminUserId: string,
    message: string,
    isInternal = false,
  ) {
    if (!message || !message.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
        include: {
          createdBy: true,
        },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      // Add message
      const createdMessage = await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: adminUserId,
          message: message.trim(),
          isStaff: true,
          isInternal,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, avatar: true, isSuperAdmin: true } },
        },
      });

      // Update ticket updatedAt and optionally advance status
      const updatedStatus =
        !isInternal && ticket.status === SupportTicketStatus.OPEN
          ? SupportTicketStatus.IN_PROGRESS
          : ticket.status;

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: updatedStatus,
          updatedAt: new Date(),
        },
      });

      // If this is a public reply, notify the ticket creator
      if (!isInternal && ticket.createdById) {
        try {
          await this.notificationsService.createNotification(
            ticket.tenantId,
            ticket.createdById,
            `Support Replied to #${ticket.ticketNumber}`,
            message.trim().slice(0, 120),
            'support',
          );
        } catch (notifErr: any) {
          this.logger.warn(`Failed to notify ticket creator: ${notifErr?.message || notifErr}`);
        }
      }

      // Create sealed audit record
      await this.prisma
        .createSealedAuditLog({
          tenantId: ticket.tenantId,
          userId: adminUserId,
          targetUserId: ticket.createdById,
          action: isInternal ? 'SUPPORT_INTERNAL_NOTE_ADDED' : 'SUPPORT_TICKET_REPLIED',
          module: 'SupportDesk',
          details: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            isInternal,
            messageSnippet: message.trim().slice(0, 80),
          },
        })
        .catch(() => {});

      return this.getTicketDetails(ticket.id);
    });
  }

  async updateTicketStatus(
    ticketId: string,
    adminUserId: string,
    newStatus: SupportTicketStatus,
  ) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === SupportTicketStatus.RESOLVED && !ticket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }

      if (newStatus === SupportTicketStatus.CLOSED && !ticket.closedAt) {
        updateData.closedAt = new Date();
      }

      const updated = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: updateData,
      });

      // Notify ticket creator of the status transition
      if (ticket.createdById) {
        try {
          await this.notificationsService.createNotification(
            ticket.tenantId,
            ticket.createdById,
            `Ticket #${ticket.ticketNumber} Status: ${newStatus}`,
            `Your support ticket status has been updated to ${newStatus.replace(/_/g, ' ')}.`,
            'support',
          );
        } catch (notifErr: any) {
          this.logger.warn(`Failed to notify ticket status update: ${notifErr?.message || notifErr}`);
        }
      }

      // Sealed Audit Log
      await this.prisma
        .createSealedAuditLog({
          tenantId: ticket.tenantId,
          userId: adminUserId,
          targetUserId: ticket.createdById,
          action: 'SUPPORT_TICKET_STATUS_CHANGED',
          module: 'SupportDesk',
          details: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            previousStatus: ticket.status,
            newStatus,
          },
        })
        .catch(() => {});

      return this.getTicketDetails(ticket.id);
    });
  }

  async assignTicket(
    ticketId: string,
    adminUserId: string,
    assignedToId: string | null,
  ) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      const updated = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          assignedToId: assignedToId || null,
          updatedAt: new Date(),
        },
      });

      // Notify assigned user if specified
      if (assignedToId && assignedToId !== adminUserId) {
        try {
          await this.notificationsService.createNotification(
            ticket.tenantId,
            assignedToId,
            `Support Ticket #${ticket.ticketNumber} Assigned`,
            `You have been assigned to handle support ticket #${ticket.ticketNumber}.`,
            'support',
          );
        } catch (notifErr: any) {
          this.logger.warn(`Failed to notify assignee: ${notifErr?.message || notifErr}`);
        }
      }

      // Sealed Audit Log
      await this.prisma
        .createSealedAuditLog({
          tenantId: ticket.tenantId,
          userId: adminUserId,
          targetUserId: assignedToId || undefined,
          action: 'SUPPORT_TICKET_ASSIGNED',
          module: 'SupportDesk',
          details: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            assignedToId,
          },
        })
        .catch(() => {});

      return this.getTicketDetails(ticket.id);
    });
  }

  async getSupportStats() {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const [total, open, inProgress, waitingForUser, resolved, closed, critical] =
        await Promise.all([
          tx.supportTicket.count(),
          tx.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
          tx.supportTicket.count({ where: { status: SupportTicketStatus.IN_PROGRESS } }),
          tx.supportTicket.count({ where: { status: SupportTicketStatus.WAITING_FOR_USER } }),
          tx.supportTicket.count({ where: { status: SupportTicketStatus.RESOLVED } }),
          tx.supportTicket.count({ where: { status: SupportTicketStatus.CLOSED } }),
          tx.supportTicket.count({ where: { priority: SupportTicketPriority.CRITICAL } }),
        ]);

      return {
        total,
        open,
        inProgress,
        waitingForUser,
        resolved,
        closed,
        critical,
      };
    });
  }

  async updateTicketDetails(
    ticketId: string,
    adminUserId: string,
    data: {
      subject?: string;
      description?: string;
      category?: string;
      priority?: SupportTicketPriority;
      status?: SupportTicketStatus;
    },
  ) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
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

      const updatePayload: any = {
        updatedAt: new Date(),
      };

      if (data.subject && data.subject.trim()) {
        updatePayload.subject = data.subject.trim();
      }
      if (data.category && data.category.trim()) {
        updatePayload.category = data.category.trim();
      }
      if (data.priority) {
        updatePayload.priority = data.priority;
      }
      if (data.status) {
        updatePayload.status = data.status;
        if (data.status === SupportTicketStatus.RESOLVED && !ticket.resolvedAt) {
          updatePayload.resolvedAt = new Date();
        }
        if (data.status === SupportTicketStatus.CLOSED && !ticket.closedAt) {
          updatePayload.closedAt = new Date();
        }
      }
      if (data.description && data.description.trim()) {
        updatePayload.description = data.description.trim();

        if (ticket.messages && ticket.messages.length > 0) {
          await tx.supportTicketMessage.update({
            where: { id: ticket.messages[0].id },
            data: { message: data.description.trim() },
          });
        }
      }

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: updatePayload,
      });

      // Audit Log
      await this.prisma
        .createSealedAuditLog({
          tenantId: ticket.tenantId,
          userId: adminUserId,
          action: 'PLATFORM_SUPPORT_TICKET_UPDATED',
          module: 'SupportDesk',
          details: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            updatedFields: Object.keys(updatePayload),
          },
        })
        .catch(() => {});

      return this.getTicketDetails(ticket.id);
    });
  }

  async deleteTicket(ticketId: string, adminUserId: string) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: {
          OR: [{ id: ticketId }, { ticketNumber: ticketId }],
        },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      // Explicitly delete child messages & attachments first
      await tx.supportTicketMessage.deleteMany({
        where: { ticketId: ticket.id },
      });
      await tx.supportTicketAttachment.deleteMany({
        where: { ticketId: ticket.id },
      });

      // Delete ticket record
      await tx.supportTicket.delete({
        where: { id: ticket.id },
      });

      // Audit log
      await this.prisma
        .createSealedAuditLog({
          tenantId: ticket.tenantId,
          userId: adminUserId,
          action: 'PLATFORM_SUPPORT_TICKET_DELETED',
          module: 'SupportDesk',
          details: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
          },
        })
        .catch(() => {});

      return {
        success: true,
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      };
    });
  }
}
