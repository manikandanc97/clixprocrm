import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(tenantId: string, userId: string, data: CreateTaskDto) {
    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      if (data.assignedToId) {
        const isValidAssignee = await tx.tenantUser.findFirst({
          where: { userId: data.assignedToId, tenantId, status: 'ACTIVE' },
        });
        if (!isValidAssignee) {
          throw new HttpException(
            {
              success: false,
              message:
                'Invalid assignment: User does not belong to this workspace or is inactive.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const task = await tx.task.create({
        data: {
          tenantId,
          title: data.title,
          description: data.description || null,
          dueDate: new Date(data.dueDate),
          assignedToId: data.assignedToId,
          createdById: userId,
          priority: data.priority || 'MEDIUM',
          status: data.status || 'PENDING',
          visibility: data.visibility || 'PRIVATE',
          reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
          relatedLeadId: data.relatedLeadId || null,
          relatedCustomerId: data.relatedCustomerId || null,
          relatedMeetingId: data.relatedMeetingId || null,
          relatedQuotationId: data.relatedQuotationId || null,
          relatedDealId: data.relatedDealId || null,
          tags: data.tags || [],
          checklist: data.checklist ? data.checklist : [],
          attachments: data.attachments ? data.attachments : [],
          completedAt: data.status === 'COMPLETED' ? new Date() : null,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          relatedLead: { select: { id: true, name: true, company: true } },
          relatedCustomer: { select: { id: true, name: true, company: true } },
        },
      });

      // 1. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TASK_CREATED',
          module: 'TASKS',
          details: {
            taskId: task.id,
            title: task.title,
            assignedToId: task.assignedToId,
            priority: task.priority,
          },
        },
      });

      // 2. Timeline Event if linked to lead
      if (task.relatedLeadId) {
        await tx.timelineEvent.create({
          data: {
            tenantId,
            leadId: task.relatedLeadId,
            userId,
            action: 'Task Created',
            description: `Task "${task.title}" created and assigned.`,
          },
        });
      }

      // 3. Notification to assignee
      if (task.assignedToId && task.assignedToId !== userId) {
        await tx.notification.create({
          data: {
            tenantId,
            userId: task.assignedToId,
            title: 'Task Assigned',
            message: `You have been assigned to task "${task.title}".`,
            type: 'TASK_ASSIGNED',
          },
        });
      }

      return task;
    });
  }

  async updateTask(
    tenantId: string,
    user: any,
    id: string,
    data: UpdateTaskDto,
  ) {
    const userId = user.id || user.sub;
    const rawRole =
      typeof user.role === 'object'
        ? user.role?.name || ''
        : String(user.role || '');
    const roleName = rawRole.toUpperCase().replace(/[\s_]+/g, '');
    const isSuperAdminOrAdmin =
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      roleName === 'OWNER' ||
      user.role?.isSystem;

    // Evaluate if user has explicit update permission
    const hasFullEditAccess = isSuperAdminOrAdmin || roleName === 'MANAGER';

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const existing = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!existing || existing.deletedAt) {
        throw new HttpException(
          { success: false, message: 'Task not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      const isOwner = existing.assignedToId === userId;

      if (!hasFullEditAccess && !isOwner) {
        throw new HttpException(
          {
            success: false,
            message: 'Forbidden: You do not have permission to edit this task.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (!hasFullEditAccess && isOwner) {
        if (
          data.assignedToId !== undefined &&
          data.assignedToId !== existing.assignedToId
        ) {
          throw new HttpException(
            {
              success: false,
              message:
                'Forbidden: You do not have permission to reassign this task.',
            },
            HttpStatus.FORBIDDEN,
          );
        }
      }

      if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
        const isValidAssignee = await tx.tenantUser.findFirst({
          where: { userId: data.assignedToId, tenantId, status: 'ACTIVE' },
        });
        if (!isValidAssignee) {
          throw new HttpException(
            {
              success: false,
              message:
                'Invalid assignment: User does not belong to this workspace or is inactive.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const targetStatus = data.status || existing.status;

      let completedAtValue = existing.completedAt;
      if (targetStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
        completedAtValue = new Date();
      } else if (
        targetStatus !== 'COMPLETED' &&
        existing.status === 'COMPLETED'
      ) {
        completedAtValue = null;
      }

      const updatedTask = await tx.task.update({
        where: { id, tenantId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
          ...(data.assignedToId !== undefined && {
            assignedToId: data.assignedToId,
          }),
          ...(data.priority !== undefined && { priority: data.priority }),
          status: targetStatus,
          ...(data.visibility !== undefined && { visibility: data.visibility }),
          ...(data.reminderDate !== undefined && {
            reminderDate: data.reminderDate
              ? new Date(data.reminderDate)
              : null,
          }),
          ...(data.relatedLeadId !== undefined && {
            relatedLeadId: data.relatedLeadId,
          }),
          ...(data.relatedCustomerId !== undefined && {
            relatedCustomerId: data.relatedCustomerId,
          }),
          ...(data.relatedMeetingId !== undefined && {
            relatedMeetingId: data.relatedMeetingId,
          }),
          ...(data.relatedQuotationId !== undefined && {
            relatedQuotationId: data.relatedQuotationId,
          }),
          ...(data.relatedDealId !== undefined && {
            relatedDealId: data.relatedDealId,
          }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.checklist !== undefined && { checklist: data.checklist }),
          ...(data.attachments !== undefined && {
            attachments: data.attachments,
          }),
          completedAt: completedAtValue,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          relatedLead: { select: { id: true, name: true, company: true } },
          relatedCustomer: { select: { id: true, name: true, company: true } },
        },
      });

      // Assignment Audit Log
      if (
        data.assignedToId !== undefined &&
        data.assignedToId !== existing.assignedToId
      ) {
        let action = 'TASK_ASSIGNED';
        if (data.assignedToId === null) {
          action = 'TASK_UNASSIGNED';
        } else if (existing.assignedToId) {
          action = 'TASK_REASSIGNED';
        }

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action,
            module: 'TASKS',
            details: {
              taskId: updatedTask.id,
              previousAssigneeId: existing.assignedToId,
              assignedToId: data.assignedToId,
            },
          },
        });
      }

      // Generic Update Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TASK_UPDATED',
          module: 'TASKS',
          details: {
            taskId: updatedTask.id,
            changes: data,
            status: targetStatus,
          },
        },
      });

      // Timeline Event for Lead if status changed
      if (existing.relatedLeadId) {
        if (targetStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
          await tx.timelineEvent.create({
            data: {
              tenantId,
              leadId: existing.relatedLeadId,
              userId,
              action: 'Task Completed',
              description: `Task "${existing.title}" was marked as completed.`,
            },
          });
        } else if (
          targetStatus !== 'COMPLETED' &&
          existing.status === 'COMPLETED'
        ) {
          await tx.timelineEvent.create({
            data: {
              tenantId,
              leadId: existing.relatedLeadId,
              userId,
              action: 'Task Reopened',
              description: `Task "${existing.title}" was reopened.`,
            },
          });
        } else {
          await tx.timelineEvent.create({
            data: {
              tenantId,
              leadId: existing.relatedLeadId,
              userId,
              action: 'Task Updated',
              description: `Task "${existing.title}" was updated.`,
            },
          });
        }
      }

      // Assignee Notification if changed
      if (
        data.assignedToId &&
        data.assignedToId !== existing.assignedToId &&
        data.assignedToId !== userId
      ) {
        await tx.notification.create({
          data: {
            tenantId,
            userId: data.assignedToId,
            title: 'Task Reassigned',
            message: `Task "${updatedTask.title}" has been reassigned to you.`,
            type: 'TASK_ASSIGNED',
          },
        });
      }

      // Status change notification
      if (
        targetStatus !== existing.status &&
        updatedTask.createdById &&
        updatedTask.createdById !== userId
      ) {
        await tx.notification.create({
          data: {
            tenantId,
            userId: updatedTask.createdById,
            title: `Task ${targetStatus}`,
            message: `Task "${updatedTask.title}" status changed to ${targetStatus}.`,
            type: 'TASK_UPDATED',
          },
        });
      }

      return updatedTask;
    });
  }

  async deleteTask(tenantId: string, user: any, id: string) {
    const userId = user.id || user.sub;
    const rawRole =
      typeof user.role === 'object'
        ? user.role?.name || ''
        : String(user.role || '');
    const roleName = rawRole.toUpperCase().replace(/[\s_]+/g, '');
    const isSuperAdminOrAdmin =
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      roleName === 'OWNER' ||
      user.role?.isSystem;

    // Only Admin and Manager can delete tasks
    const hasDeleteAccess = isSuperAdminOrAdmin || roleName === 'MANAGER';

    if (!hasDeleteAccess) {
      throw new HttpException(
        {
          success: false,
          message: 'Forbidden: You do not have permission to delete tasks.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const task = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!task) {
        throw new HttpException(
          { success: false, message: 'Task not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      const deletedTask = await tx.task.update({
        where: { id, tenantId },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TASK_DELETED',
          module: 'TASKS',
          details: { taskId: id, title: deletedTask.title },
        },
      });

      if (deletedTask.relatedLeadId) {
        await tx.timelineEvent.create({
          data: {
            tenantId,
            leadId: deletedTask.relatedLeadId,
            userId,
            action: 'Task Deleted',
            description: `Task "${deletedTask.title}" was deleted.`,
          },
        });
      }

      return deletedTask;
    });
  }

  async addTimelineEvent(
    tenantId: string,
    user: any,
    id: string,
    body: { action: string; description?: string; metadata?: any },
  ) {
    const userId = user.id || user.sub;

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const task = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      const event = await tx.timelineEvent.create({
        data: {
          tenantId,
          taskId: id,
          userId,
          action: body.action,
          description: body.description || '',
          metadata: body.metadata || {},
        },
      });

      if (body.action === 'BLOCKER_REPORTED') {
        await tx.task.update({
          where: { id, tenantId },
          data: { status: 'BLOCKED' },
        });
      }

      return event;
    });
  }

  async updateProgress(
    tenantId: string,
    user: any,
    id: string,
    progress: number,
  ) {
    const userId = user.id || user.sub;

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const task = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      const updatedTask = await tx.task.update({
        where: { id, tenantId },
        data: { progress },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          taskId: id,
          userId,
          action: 'PROGRESS_UPDATED',
          description: `Updated progress to ${progress}%`,
          metadata: { previousProgress: task.progress, newProgress: progress },
        },
      });

      return updatedTask;
    });
  }

  async completeTask(tenantId: string, user: any, id: string, note?: string) {
    const userId = user.id || user.sub;

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const task = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      if (task.status === 'COMPLETED') {
        throw new HttpException(
          'Task is already completed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedTask = await tx.task.update({
        where: { id, tenantId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
          completedById: userId,
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          taskId: id,
          userId,
          action: 'TASK_COMPLETED',
          description: note || 'Task was marked as completed',
          metadata: { note },
        },
      });

      return updatedTask;
    });
  }

  async resolveBlocker(tenantId: string, user: any, id: string) {
    const userId = user.id || user.sub;

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const task = await tx.task.findUnique({
        where: { id, tenantId },
      });

      if (!task) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      if (task.status !== 'BLOCKED') {
        throw new HttpException('Task is not blocked', HttpStatus.BAD_REQUEST);
      }

      const updatedTask = await tx.task.update({
        where: { id, tenantId },
        data: {
          status: 'IN_PROGRESS',
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          taskId: id,
          userId,
          action: 'BLOCKER_RESOLVED',
          description: 'Blocker was resolved',
        },
      });

      return updatedTask;
    });
  }
}
