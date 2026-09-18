import { tool } from 'ai';
import { z } from 'zod';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';

/**
 * @file ai/tools/tasks.tools.ts
 * AI tool implementations for Tasks.
 */
export function buildTasksTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
) {
  return {
    getTasks: tool({
      description:
        'Get a list of tasks visible to the user. Honors organization, team, and private visibility rules.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe('Maximum number of tasks to return. Default is 5, max 50.'),
        status: z
          .string()
          .optional()
          .describe(
            'Task status to filter by (e.g. PENDING, IN_PROGRESS, COMPLETED, OVERDUE)',
          ),
        priority: z
          .string()
          .optional()
          .describe('Task priority to filter by (e.g. HIGH, MEDIUM, LOW)'),
      }),
      execute: async (args: {
        limit?: number;
        status?: string;
        priority?: string;
      }) => {
        const toolName = 'getTasks';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.TASKS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Tasks permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Tasks.',
          };
        }

        try {
          const { limit = 5, status, priority } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getTasksVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (status) whereClause.status = status;
          if (priority) whereClause.priority = priority;

          const tasks = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.task.findMany({
                where: whereClause,
                orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
                take: safeLimit,
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  priority: true,
                  visibility: true,
                  dueDate: true,
                  assignedToId: true,
                  createdById: true,
                  assignedTo: { select: { name: true, email: true } },
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: tasks.length },
          );

          return tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            visibility: t.visibility,
            assignedTo: t.assignedTo?.name || null,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch tasks.', details: e.message };
        }
      },
    } as any),

    createTask: tool({
      description:
        'Create a new task in the CRM for the authenticated user or an authorized team member.',
      parameters: z.object({
        title: z.string().describe('Title of the task'),
        description: z
          .string()
          .optional()
          .describe('Detailed description of the task'),
        dueDate: z
          .string()
          .optional()
          .describe('Due date in ISO format (YYYY-MM-DD)'),
        priority: z
          .enum(['HIGH', 'MEDIUM', 'LOW'])
          .optional()
          .describe('Task priority. Default is MEDIUM.'),
        visibility: z
          .enum(['PRIVATE', 'TEAM', 'ORGANIZATION'])
          .optional()
          .describe('Task visibility scope. Default is PRIVATE.'),
        assignedToId: z
          .string()
          .optional()
          .describe('User ID to assign the task to. Defaults to current user.'),
      }),
      execute: async (args: {
        title: string;
        description?: string;
        dueDate?: string;
        priority?: 'HIGH' | 'MEDIUM' | 'LOW';
        visibility?: 'PRIVATE' | 'TEAM' | 'ORGANIZATION';
        assignedToId?: string;
      }) => {
        const toolName = 'createTask';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.TASKS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Tasks permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to create tasks.',
          };
        }

        try {
          const {
            title,
            description,
            dueDate,
            priority = 'MEDIUM',
            visibility = 'PRIVATE',
            assignedToId,
          } = args;

          // Target assignee authorization check
          let targetAssigneeId = userContext.userId;
          if (assignedToId && assignedToId !== userContext.userId) {
            if (userContext.isSystemAdmin) {
              targetAssigneeId = assignedToId;
            } else if (
              userContext.roleName === 'MANAGER' &&
              userContext.subordinateUserIds.includes(assignedToId)
            ) {
              targetAssigneeId = assignedToId;
            } else if (userContext.teamUserIds.includes(assignedToId)) {
              targetAssigneeId = assignedToId;
            } else {
              return {
                error: 'ACCESS_DENIED',
                message:
                  'You cannot assign tasks to users outside your organization/team scope.',
              };
            }
          }

          const newTask = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.task.create({
                data: {
                  tenantId: userContext.tenantId,
                  createdById: userContext.userId,
                  assignedToId: targetAssigneeId,
                  title,
                  description: description || null,
                  dueDate: dueDate ? new Date(dueDate) : null,
                  priority: priority as any,
                  visibility: visibility as any,
                  status: 'PENDING',
                },
                select: {
                  id: true,
                  title: true,
                  priority: true,
                  status: true,
                  visibility: true,
                  dueDate: true,
                  createdAt: true,
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            {
              taskId: newTask.id,
              title: newTask.title,
            },
          );

          return {
            success: true,
            message: `Task "${newTask.title}" created successfully.`,
            task: {
              id: newTask.id,
              title: newTask.title,
              priority: newTask.priority,
              status: newTask.status,
              visibility: newTask.visibility,
              dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
            },
          };
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to create task.', details: e.message };
        }
      },
    } as any),

    updateTaskStatus: tool({
      description: 'Update the status of an existing task visible to the user.',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to update'),
        status: z
          .enum([
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'BLOCKED',
            'CANCELLED',
            'OVERDUE',
          ])
          .describe('New task status'),
      }),
      execute: async (args: {
        taskId: string;
        status:
          | 'PENDING'
          | 'IN_PROGRESS'
          | 'COMPLETED'
          | 'BLOCKED'
          | 'CANCELLED'
          | 'OVERDUE';
      }) => {
        const toolName = 'updateTaskStatus';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.TASKS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Tasks permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to update tasks.',
          };
        }

        try {
          const { taskId, status } = args;
          const visibilityFilter =
            aiSecurityService.getTasksVisibilityFilter(userContext);

          const result = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) => {
              const existingTask = await tx.task.findFirst({
                where: { ...visibilityFilter, id: taskId },
              });

              if (!existingTask) {
                return null;
              }

              const updatedTask = await tx.task.update({
                where: { id: taskId },
                data: {
                  status: status as any,
                  completedAt: status === 'COMPLETED' ? new Date() : null,
                  completedById:
                    status === 'COMPLETED' ? userContext.userId : null,
                },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  updatedAt: true,
                },
              });

              return { existingTask, updatedTask };
            },
          );

          if (!result) {
            await aiSecurityService.logToolExecution(
              userContext,
              toolName,
              'DENIED',
              {
                taskId,
                reason: 'Task not found or not visible',
              },
            );
            return {
              error: 'NOT_FOUND_OR_DENIED',
              message:
                'Task not found or you are not authorized to update this task.',
            };
          }

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            {
              taskId,
              oldStatus: result.existingTask.status,
              newStatus: status,
            },
          );

          return {
            success: true,
            message: `Task "${result.updatedTask.title}" status updated to ${result.updatedTask.status}.`,
            task: result.updatedTask,
          };
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to update task.', details: e.message };
        }
      },
    } as any),

    getMeetings: tool({
      description:
        'Get a list of meetings / calendar events visible to the user. Honors organization, team, and private visibility rules.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe(
            'Maximum number of meetings to return. Default is 5, max 50.',
          ),
        startDate: z
          .string()
          .optional()
          .describe('Filter meetings starting on or after this ISO date'),
      }),
      execute: async (args: { limit?: number; startDate?: string }) => {
        const toolName = 'getMeetings';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.CALENDAR,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Calendar permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Meetings / Calendar.',
          };
        }

        try {
          const { limit = 5, startDate } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getMeetingsVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (startDate) whereClause.startTime = { gte: new Date(startDate) };

          const meetings = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.meeting.findMany({
                where: whereClause,
                orderBy: { startTime: 'asc' },
                take: safeLimit,
                select: {
                  id: true,
                  title: true,
                  description: true,
                  startTime: true,
                  endTime: true,
                  location: true,
                  isOnline: true,
                  status: true,
                  visibility: true,
                  ownerId: true,
                  assignedToId: true,
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: meetings.length },
          );

          return meetings.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            startTime: m.startTime.toISOString(),
            endTime: m.endTime.toISOString(),
            location: m.location,
            isOnline: m.isOnline,
            status: m.status,
            visibility: m.visibility,
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch meetings.', details: e.message };
        }
      },
    } as any),
  };
}
