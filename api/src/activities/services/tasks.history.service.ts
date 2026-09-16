import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * @file activities/services/tasks.history.service.ts
 * Audit log history and actor resolution for Tasks.
 */
@Injectable()
export class TasksHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaskHistory(tenantId: string, taskId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        module: 'TASKS',
        details: { path: ['taskId'], equals: taskId },
        action: {
          in: [
            'TASK_CREATED',
            'TASK_ASSIGNED',
            'TASK_REASSIGNED',
            'TASK_UNASSIGNED',
          ],
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const userIds = new Set<string>();
    logs.forEach((log) => {
      const details = (log.details as any) || {};
      if (details.assignedToId) userIds.add(details.assignedToId);
      if (details.previousAssigneeId) userIds.add(details.previousAssigneeId);
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return logs.map((log) => {
      const details = (log.details as any) || {};
      return {
        id: log.id,
        action: log.action,
        actor: log.user ? log.user.name : 'System',
        assignedTo: details.assignedToId
          ? userMap.get(details.assignedToId)
          : null,
        previousAssignee: details.previousAssigneeId
          ? userMap.get(details.previousAssigneeId)
          : null,
        createdAt: log.createdAt.toISOString(),
      };
    });
  }
}
