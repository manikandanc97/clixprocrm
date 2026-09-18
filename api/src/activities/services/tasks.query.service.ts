import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TaskStatus, TaskPriority } from '@prisma/client';
import { formatRelativeDate } from '../../common/utils/crm-formatters.util';
import { TaskQueryDto } from '../dto/task-query.dto';
import { TasksExportService } from './tasks.export.service';
import { TasksHistoryService } from './tasks.history.service';

/**
 * @file activities/services/tasks.query.service.ts
 * Query, filtering, RBAC visibility scoping, and single-task retrieval for Tasks.
 * Export logic is in tasks.export.service.ts.
 * History logic is in tasks.history.service.ts.
 */
@Injectable()
export class TasksQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksExportService: TasksExportService,
    private readonly tasksHistoryService: TasksHistoryService,
  ) {}

  async syncOverdueTasks(tenantId: string) {
    const now = new Date();
    try {
      await this.prisma.withTenantContext({ tenantId }, async (tx) => {
        await tx.task.updateMany({
          where: {
            tenantId,
            deletedAt: null,
            dueDate: { lt: now },
            status: { notIn: ['COMPLETED', 'CANCELLED', 'OVERDUE'] },
          },
          data: { status: 'OVERDUE' },
        });
      });
    } catch {
      // Ignore if error during status auto-update
    }
  }

  async getTasks(
    tenantId: string,
    options: TaskQueryDto & { userId: string; role: string },
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 50, 10000));
    const offset = (page - 1) * limit;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`t."tenantId" = ${tenantId}`,
      Prisma.sql`t."deletedAt" IS NULL`,
    ];

      // Role-based visibility scoping
      if (options.role && options.userId) {
        const rawRole =
          typeof options.role === 'object'
            ? (options.role as any)?.name || ''
            : String(options.role || '');
        const userRole = rawRole.toUpperCase().replace(/[\s_]+/g, '');
        if (
          userRole !== 'ADMIN' &&
          userRole !== 'SUPERADMIN' &&
          userRole !== 'OWNER'
        ) {
          // Single query for tenant user hierarchy and department team members
          const tenantUser = await this.prisma.withTenantContext({ tenantId }, (tx) =>
            tx.tenantUser.findUnique({
              where: {
                tenantId_userId: {
                  tenantId,
                  userId: options.userId,
                },
              },
              select: {
                id: true,
                departmentId: true,
                subordinates: {
                  where: { status: 'ACTIVE' },
                  select: { userId: true },
                },
                department: {
                  select: {
                    users: {
                      where: { status: 'ACTIVE' },
                      select: { userId: true },
                    },
                  },
                },
              },
            })
          );

          const subordinateUserIds =
            tenantUser?.subordinates?.map((s) => s.userId) || [];
          const managerScopeUserIds = [options.userId, ...subordinateUserIds];
          const teamUserIds =
            tenantUser?.department?.users?.map((u) => u.userId) || [];

          const rbacOrConditions: Prisma.Sql[] = [
            Prisma.sql`t."assignedToId" IN (${Prisma.join(managerScopeUserIds)})`,
            Prisma.sql`t."createdById" IN (${Prisma.join(managerScopeUserIds)})`,
            Prisma.sql`t."visibility" = 'ORGANIZATION'`,
          ];

          if (teamUserIds.length > 0) {
            rbacOrConditions.push(
              Prisma.sql`(t."visibility" = 'TEAM' AND (t."assignedToId" IN (${Prisma.join(teamUserIds)}) OR t."createdById" IN (${Prisma.join(teamUserIds)})))`,
            );
          }

          whereConditions.push(
            Prisma.sql`(${Prisma.join(rbacOrConditions, ' OR ')})`,
          );
        }
      }

      if (options.search && options.search.trim() !== '') {
        const search = options.search.trim();
        const searchPattern = `%${search}%`;
        whereConditions.push(
          Prisma.sql`(t."title" ILIKE ${searchPattern} OR t."description" ILIKE ${searchPattern} OR ${search} = ANY(t."tags"))`,
        );
      }

      if (options.status && options.status !== 'all') {
        whereConditions.push(
          Prisma.sql`t."status" = ${options.status.toUpperCase()}::"TaskStatus"`,
        );
      }

      if (options.priority && options.priority !== 'all') {
        whereConditions.push(
          Prisma.sql`t."priority" = ${options.priority.toUpperCase()}::"TaskPriority"`,
        );
      }

      if (options.assignedToId && options.assignedToId !== 'all') {
        if (options.assignedToId === 'unassigned') {
          whereConditions.push(Prisma.sql`t."assignedToId" IS NULL`);
        } else {
          whereConditions.push(
            Prisma.sql`t."assignedToId" = ${options.assignedToId}`,
          );
        }
      }

      if (options.createdById) {
        whereConditions.push(
          Prisma.sql`t."createdById" = ${options.createdById}`,
        );
      }

      if (options.relatedLeadId) {
        whereConditions.push(
          Prisma.sql`t."relatedLeadId" = ${options.relatedLeadId}`,
        );
      }

      if (options.relatedCustomerId) {
        whereConditions.push(
          Prisma.sql`t."relatedCustomerId" = ${options.relatedCustomerId}`,
        );
      }

      if (options.tags && options.tags.length > 0) {
        whereConditions.push(
          Prisma.sql`t."tags" && ARRAY[${Prisma.join(options.tags)}]::text[]`,
        );
      }

      if (options.startDate) {
        whereConditions.push(
          Prisma.sql`t."dueDate" >= ${new Date(options.startDate)}`,
        );
      }
      if (options.endDate) {
        whereConditions.push(
          Prisma.sql`t."dueDate" <= ${new Date(options.endDate)}`,
        );
      }

      const whereSql = Prisma.join(whereConditions, ' AND ');

      let orderSql: Prisma.Sql;
      const isDesc = options.sortOrder === 'desc';
      switch (options.sortBy) {
        case 'createdAt':
          orderSql = isDesc
            ? Prisma.sql`t."createdAt" DESC`
            : Prisma.sql`t."createdAt" ASC`;
          break;
        case 'title':
          orderSql = isDesc
            ? Prisma.sql`t."title" DESC, t."createdAt" DESC`
            : Prisma.sql`t."title" ASC, t."createdAt" DESC`;
          break;
        case 'priority':
          orderSql = isDesc
            ? Prisma.sql`t."priority" DESC, t."createdAt" DESC`
            : Prisma.sql`t."priority" ASC, t."createdAt" DESC`;
          break;
        case 'status':
          orderSql = isDesc
            ? Prisma.sql`t."status" DESC, t."createdAt" DESC`
            : Prisma.sql`t."status" ASC, t."createdAt" DESC`;
          break;
        default:
          orderSql = isDesc
            ? Prisma.sql`t."dueDate" DESC NULLS LAST, t."createdAt" DESC`
            : Prisma.sql`t."dueDate" ASC NULLS LAST, t."createdAt" DESC`;
          break;
      }

      const rawResult = await this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.$queryRaw<
          Array<{
            tasks_json: any;
            filtered_count: number;
            total_count: number;
            pending_count: number;
            in_progress_count: number;
            completed_count: number;
            blocked_count: number;
            overdue_count: number;
            due_today_count: number;
          }>
        >`
          WITH filtered_tasks AS (
            SELECT
              t."id",
              t."tenantId",
              t."title",
              t."description",
              t."status",
              t."priority",
              t."dueDate",
              t."reminderDate",
              t."assignedToId",
              t."createdById",
              t."relatedLeadId",
              t."relatedCustomerId",
              t."relatedMeetingId",
              t."relatedQuotationId",
              t."tags",
              t."checklist",
              t."attachments",
              t."completedAt",
              t."deletedAt",
              t."createdAt",
              t."updatedAt",
              t."progress",
              CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'name', u.name, 'email', u.email) ELSE NULL END AS "assignedTo",
              CASE WHEN l.id IS NOT NULL THEN json_build_object('id', l.id, 'name', l.name, 'company', l.company, 'email', l.email) ELSE NULL END AS "relatedLead",
              CASE WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name, 'company', c.company, 'email', c.email) ELSE NULL END AS "relatedCustomer",
              CASE WHEN m.id IS NOT NULL THEN json_build_object('id', m.id, 'title', m.title) ELSE NULL END AS "relatedMeeting",
              CASE WHEN q.id IS NOT NULL THEN json_build_object('id', q.id, 'quoteNumber', q."quoteNumber", 'client', q.client, 'amount', q.amount::float) ELSE NULL END AS "relatedQuotation"
            FROM "Task" t
            LEFT JOIN "User" u ON t."assignedToId" = u.id
            LEFT JOIN "Lead" l ON t."relatedLeadId" = l.id
            LEFT JOIN "Customer" c ON t."relatedCustomerId" = c.id
            LEFT JOIN "Meeting" m ON t."relatedMeetingId" = m.id
            LEFT JOIN "Quotation" q ON t."relatedQuotationId" = q.id
            WHERE ${whereSql}
            ORDER BY ${orderSql}
            LIMIT ${limit} OFFSET ${offset}
          ),
          filtered_count AS (
            SELECT COUNT(*)::int as count FROM "Task" t WHERE ${whereSql}
          ),
          stats AS (
            SELECT
              COUNT(*)::int as total_count,
              COUNT(CASE WHEN "status" = 'PENDING'::"TaskStatus" THEN 1 END)::int as pending_count,
              COUNT(CASE WHEN "status" = 'IN_PROGRESS'::"TaskStatus" THEN 1 END)::int as in_progress_count,
              COUNT(CASE WHEN "status" = 'COMPLETED'::"TaskStatus" THEN 1 END)::int as completed_count,
              COUNT(CASE WHEN "status" = 'BLOCKED'::"TaskStatus" THEN 1 END)::int as blocked_count,
              COUNT(CASE WHEN "dueDate" < ${now} AND "status" NOT IN ('COMPLETED'::"TaskStatus", 'CANCELLED'::"TaskStatus") THEN 1 END)::int as overdue_count,
              COUNT(CASE WHEN "dueDate" >= ${todayStart} AND "dueDate" < ${todayEnd} THEN 1 END)::int as due_today_count
            FROM "Task"
            WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL
          )
          SELECT
            (SELECT COALESCE(json_agg(ft.*), '[]'::json) FROM filtered_tasks ft) AS tasks_json,
            fc.count as filtered_count,
            s.total_count,
            s.pending_count,
            s.in_progress_count,
            s.completed_count,
            s.blocked_count,
            s.overdue_count,
            s.due_today_count
          FROM filtered_count fc, stats s;
        `
      );

      const row = rawResult[0] || {
        tasks_json: [],
        filtered_count: 0,
        total_count: 0,
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        blocked_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      };

      const tasksList: any[] = row.tasks_json || [];
      const total = Number(row.filtered_count || 0);
      const totalCount = Number(row.total_count || 0);
      const completedCount = Number(row.completed_count || 0);
      const pendingCount = Number(row.pending_count || 0);
      const inProgressCount = Number(row.in_progress_count || 0);
      const blockedCount = Number(row.blocked_count || 0);
      const overdueCount = Number(row.overdue_count || 0);
      const dueTodayCount = Number(row.due_today_count || 0);

      const taskStats = [
        {
          label: 'Total Tasks',
          value: totalCount,
          change: '+0%',
          changeType: 'neutral',
          icon: 'CheckSquare',
          color: 'primary',
        },
        {
          label: 'Pending',
          value: pendingCount,
          change: '+0%',
          changeType: 'neutral',
          icon: 'Clock',
          color: 'warning',
        },
        {
          label: 'In Progress',
          value: inProgressCount,
          change: '+0%',
          changeType: 'neutral',
          icon: 'PlayCircle',
          color: 'info',
        },
        {
          label: 'Completed',
          value: completedCount,
          change: '+0%',
          changeType: 'positive',
          icon: 'CheckCircle2',
          color: 'success',
        },
        {
          label: 'Overdue',
          value: overdueCount,
          change: '+0%',
          changeType: overdueCount > 0 ? 'negative' : 'neutral',
          icon: 'AlertTriangle',
          color: 'destructive',
        },
      ];

      const formattedTasks = tasksList.map((task: any) => {
        const checklistArray = Array.isArray(task.checklist)
          ? (task.checklist as any[])
          : [];
        const totalChecklist = checklistArray.length;
        const completedChecklist = checklistArray.filter(
          (c: any) => c.completed,
        ).length;
        const progressPercent =
          totalChecklist > 0
            ? Math.round((completedChecklist / totalChecklist) * 100)
            : task.status === 'COMPLETED'
              ? 100
              : task.progress || 0;
        const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
        const isTaskOverdue = Boolean(
          dueDateObj &&
          dueDateObj < now &&
          task.status !== 'COMPLETED' &&
          task.status !== 'CANCELLED',
        );

        return {
          id: task.id,
          tenantId: task.tenantId,
          title: task.title,
          description: task.description || '',
          status:
            isTaskOverdue &&
            task.status !== 'COMPLETED' &&
            task.status !== 'CANCELLED'
              ? ('OVERDUE' as TaskStatus)
              : task.status,
          priority: task.priority,
          dueDate: formatRelativeDate(task.dueDate, {
            fallback: 'No due date',
          }),
          dueDateValue: dueDateObj ? dueDateObj.toISOString() : null,
          reminderDate: task.reminderDate
            ? new Date(task.reminderDate).toISOString()
            : null,
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          relatedLeadId: task.relatedLeadId,
          relatedCustomerId: task.relatedCustomerId,
          relatedMeetingId: task.relatedMeetingId,
          relatedQuotationId: task.relatedQuotationId,
          tags: task.tags || [],
          checklist: checklistArray,
          attachments: Array.isArray(task.attachments)
            ? (task.attachments as any[])
            : [],
          completedAt: task.completedAt
            ? new Date(task.completedAt).toISOString()
            : null,
          deletedAt: task.deletedAt
            ? new Date(task.deletedAt).toISOString()
            : null,
          createdAt: new Date(task.createdAt).toISOString(),
          updatedAt: new Date(task.updatedAt).toISOString(),
          assignedTo: task.assignedTo
            ? {
                id: task.assignedTo.id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
              }
            : null,
          createdBy: task.createdById
            ? { id: task.createdById, name: 'Owner', email: '' }
            : null,
          relatedLead: task.relatedLead
            ? {
                id: task.relatedLead.id,
                name: task.relatedLead.name,
                company: task.relatedLead.company,
                email: task.relatedLead.email,
              }
            : null,
          relatedCustomer: task.relatedCustomer
            ? {
                id: task.relatedCustomer.id,
                name: task.relatedCustomer.name,
                company: task.relatedCustomer.company,
                email: task.relatedCustomer.email,
              }
            : null,
          relatedMeeting: task.relatedMeeting
            ? {
                id: task.relatedMeeting.id,
                name: task.relatedMeeting.title || task.relatedMeeting.name,
              }
            : null,
          relatedQuotation: task.relatedQuotation
            ? {
                id: task.relatedQuotation.id,
                name:
                  task.relatedQuotation.quoteNumber ||
                  task.relatedQuotation.name,
                company:
                  task.relatedQuotation.client || task.relatedQuotation.company,
                amount: Number(task.relatedQuotation.amount),
              }
            : null,
          isOverdue: isTaskOverdue,
          progress: progressPercent,
          subtaskCount: {
            total: totalChecklist,
            completed: completedChecklist,
          },
        };
      });

      return {
        stats: taskStats,
        dashboardStats: {
          total: totalCount,
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount,
          overdue: overdueCount,
          blocked: blockedCount,
          dueToday: dueTodayCount,
          completionRate:
            totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0,
        },
        tasks: formattedTasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
  }

  async exportTasks(tenantId: string, userId: string, query: any) {
    return this.tasksExportService.exportTasks(tenantId, userId, query);
  }

  async getTaskById(
    tenantId: string,
    id: string,
    options?: { userId: string; role: string },
  ) {
    const where: Prisma.TaskWhereInput = { id, tenantId, deletedAt: null };

      if (options?.role && options?.userId) {
        const rawRole =
          typeof options.role === 'object'
            ? (options.role as any)?.name || ''
            : String(options.role || '');
        const userRole = rawRole.toUpperCase().replace(/[\s_]+/g, '');
        if (
          userRole !== 'ADMIN' &&
          userRole !== 'SUPERADMIN' &&
          userRole !== 'OWNER'
        ) {
          const tenantUser = await this.prisma.withTenantContext({ tenantId }, (tx) =>
            tx.tenantUser.findFirst({
              where: { tenantId, userId: options.userId },
            })
          );

          const subordinates = await this.prisma.withTenantContext({ tenantId }, (tx) =>
            tx.tenantUser.findMany({
              where: {
                tenantId,
                reportingManagerId: tenantUser?.id,
              },
              select: { userId: true },
            })
          );
          const subordinateUserIds = subordinates.map((s) => s.userId);
          const managerScopeUserIds = [options.userId, ...subordinateUserIds];

          let teamUserIds: string[] = [];
          if (tenantUser?.departmentId) {
            const teamUsers = await this.prisma.withTenantContext({ tenantId }, (tx) =>
              tx.tenantUser.findMany({
                where: { tenantId, departmentId: tenantUser.departmentId },
                select: { userId: true },
              })
            );
            teamUserIds = teamUsers.map((u) => u.userId);
          }

          where.OR = [
            { assignedToId: { in: managerScopeUserIds } },
            { createdById: { in: managerScopeUserIds } },
            { visibility: 'ORGANIZATION' },
          ];

          if (teamUserIds.length > 0) {
            where.OR.push({
              visibility: 'TEAM',
              OR: [
                { assignedToId: { in: teamUserIds } },
                { createdById: { in: teamUserIds } },
              ],
            });
          }
        }
      }

      const task = await this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.task.findFirst({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          relatedLead: {
            select: { id: true, name: true, company: true, email: true },
          },
          relatedCustomer: {
            select: { id: true, name: true, company: true, email: true },
          },
          relatedMeeting: { select: { id: true, title: true } },
          relatedQuotation: {
            select: { id: true, quoteNumber: true, client: true, amount: true },
          },
          timelineEvents: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          attachmentsList: true,
        },
      }));

      if (!task) return null;

      const checklistArray = Array.isArray(task.checklist)
        ? (task.checklist as any[])
        : [];
      const totalChecklist = checklistArray.length;
      const completedChecklist = checklistArray.filter(
        (c: any) => c.completed,
      ).length;
      const now = new Date();
      const isTaskOverdue = Boolean(
        task.dueDate &&
        task.dueDate < now &&
        task.status !== 'COMPLETED' &&
        task.status !== 'CANCELLED',
      );

      return {
        ...task,
        description: task.description || '',
        dueDateValue: task.dueDate ? task.dueDate.toISOString() : null,
        dueDate: formatRelativeDate(task.dueDate, { fallback: 'No due date' }),
        reminderDate: task.reminderDate
          ? task.reminderDate.toISOString()
          : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        checklist: checklistArray,
        attachments: Array.isArray(task.attachments)
          ? (task.attachments as any[])
          : [],
        isOverdue: isTaskOverdue,
        progress:
          task.progress > 0
            ? task.progress
            : totalChecklist > 0
              ? Math.round((completedChecklist / totalChecklist) * 100)
              : task.status === 'COMPLETED'
                ? 100
                : 0,
        subtaskCount: { total: totalChecklist, completed: completedChecklist },
      };
  }

  async getTaskHistory(tenantId: string, taskId: string) {
    return this.tasksHistoryService.getTaskHistory(tenantId, taskId);
  }
}
