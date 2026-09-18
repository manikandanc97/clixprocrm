import { Injectable } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * @file activities/services/tasks.export.service.ts
 * CSV export generation and audit logging for Tasks.
 */
@Injectable()
export class TasksExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTasks(tenantId: string, userId: string, query: any) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const where: Prisma.TaskWhereInput = {
        tenantId,
        deletedAt: null,
      };

      if (query.ids) {
        const ids = query.ids.split(',');
        where.id = { in: ids };
      } else {
        if (query.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ];
        }
        if (query.status && query.status !== 'all')
          where.status = query.status as TaskStatus;
        if (query.priority && query.priority !== 'all')
          where.priority = query.priority as TaskPriority;
        if (query.assignedToId) where.assignedToId = query.assignedToId;
      }

      const tasks = await tx.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          relatedLead: { select: { name: true } },
          relatedCustomer: { select: { name: true } },
        },
      });

      const headers = [
        'Task ID',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Due Date',
        'Assigned To',
        'Related Entity',
        'Created At',
      ];

      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        let stringValue = String(value);
        if (/^[=+\-@]/.test(stringValue)) {
          stringValue = "'" + stringValue;
        }
        if (stringValue.includes('"')) {
          stringValue = stringValue.replace(/"/g, '""');
        }
        if (
          stringValue.includes(',') ||
          stringValue.includes('\n') ||
          stringValue.includes('"')
        ) {
          return `"${stringValue}"`;
        }
        return stringValue;
      };

      const csvRows = [headers.join(',')];

      for (const task of tasks) {
        const relatedEntity =
          task.relatedLead?.name || task.relatedCustomer?.name || '';
        const row = [
          escapeCSV(task.id),
          escapeCSV(task.title),
          escapeCSV(task.description),
          escapeCSV(task.status),
          escapeCSV(task.priority),
          escapeCSV(task.dueDate ? new Date(task.dueDate).toISOString() : ''),
          escapeCSV(task.assignedTo?.name || task.assignedTo?.email || ''),
          escapeCSV(relatedEntity),
          escapeCSV(task.createdAt.toISOString()),
        ];
        csvRows.push(row.join(','));
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'EXPORT_TASKS',
          module: 'TASKS',
          details: { count: tasks.length, filters: query },
        },
      });

      return csvRows.join('\n');
    });
  }
}
