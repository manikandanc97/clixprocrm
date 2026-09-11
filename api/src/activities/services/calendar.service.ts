import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendarEvents(
    tenantId: string,
    user: any,
    startParam: string,
    endParam: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const start = new Date(startParam);
      const end = new Date(endParam);
      const userId = user.sub || user.id;
      const rawRole =
        typeof user.role === 'object'
          ? user.role?.name || ''
          : String(user.role || '');
      const userRole = rawRole.toUpperCase().replace(/[\s_]+/g, '');

      const meetingWhere: any = {
        tenantId,
        startTime: { gte: start },
        endTime: { lte: end },
      };

      const taskWhere: any = {
        tenantId,
        dueDate: { gte: start, lte: end },
      };

      const leadWhere: any = {
        tenantId,
        expectedCloseDate: { gte: start, lte: end },
      };

      if (
        userRole !== 'ADMIN' &&
        userRole !== 'SUPERADMIN' &&
        userRole !== 'OWNER'
      ) {
        const tenantUser = await tx.tenantUser.findFirst({
          where: { tenantId, userId },
        });

        const subordinates = await tx.tenantUser.findMany({
          where: { tenantId, reportingManagerId: tenantUser?.id },
          select: { userId: true },
        });
        const subordinateUserIds = subordinates.map((s) => s.userId);
        const managerScopeUserIds = [userId, ...subordinateUserIds];

        let teamUserIds: string[] = [];
        if (tenantUser?.departmentId) {
          const teamUsers = await tx.tenantUser.findMany({
            where: { tenantId, departmentId: tenantUser.departmentId },
            select: { userId: true },
          });
          teamUserIds = teamUsers.map((u) => u.userId);
        }

        taskWhere.OR = [
          { assignedToId: { in: managerScopeUserIds } },
          { createdById: { in: managerScopeUserIds } },
          { visibility: 'ORGANIZATION' },
        ];

        if (teamUserIds.length > 0) {
          taskWhere.OR.push({
            visibility: 'TEAM',
            OR: [
              { assignedToId: { in: teamUserIds } },
              { createdById: { in: teamUserIds } },
            ],
          });
        }

        meetingWhere.OR = [
          { assignedToId: { in: managerScopeUserIds } },
          { ownerId: { in: managerScopeUserIds } },
          { visibility: 'ORGANIZATION' },
        ];

        if (teamUserIds.length > 0) {
          meetingWhere.OR.push({
            visibility: 'TEAM',
            OR: [
              { assignedToId: { in: teamUserIds } },
              { ownerId: { in: teamUserIds } },
            ],
          });
        }

        leadWhere.OR = [
          { assignedToId: { in: managerScopeUserIds } },
          { createdById: { in: managerScopeUserIds } },
        ];
      }

      // Fetch Meetings, Tasks, and Leads for the given timeframe
      const [meetings, tasks, leads] = await Promise.all([
        tx.meeting.findMany({
          where: meetingWhere,
          include: {
            assignedTo: { select: { id: true, name: true } },
            lead: { select: { id: true, name: true, company: true } },
          },
        }),
        tx.task.findMany({
          where: taskWhere,
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        }),
        tx.lead.findMany({
          where: leadWhere,
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        }),
      ]);

      // Format all to a unified CalendarEvent structure
      const calendarEvents = [
        ...meetings.map((m: any) => ({
          id: `meeting-${m.id}`,
          dbId: m.id,
          source: 'meeting',
          title: m.title,
          description: m.description,
          startTime: m.startTime.toISOString(),
          endTime: m.endTime.toISOString(),
          isAllDay: m.isAllDay,
          type: m.type, // MEETING, CALL, HOLIDAY, BIRTHDAY, LEAVE
          status: m.status,
          location: m.location,
          isOnline: m.isOnline,
          assignedToId: m.assignedToId,
          relatedLead: m.lead,
        })),
        ...tasks.map((t: any) => {
          // Assume tasks are all-day events on their due date, or 1 hour if not specified
          const tStart = t.dueDate ? new Date(t.dueDate) : new Date();
          const tEnd = new Date(tStart);
          tEnd.setHours(tEnd.getHours() + 1);

          return {
            id: `task-${t.id}`,
            dbId: t.id,
            source: 'task',
            title: `Task: ${t.title}`,
            description: t.description,
            startTime: tStart.toISOString(),
            endTime: tEnd.toISOString(),
            isAllDay: true,
            type: 'TASK',
            status: t.status,
            location: null,
            isOnline: false,
            assignedTo: t.assignedTo,
            relatedLead: null,
          };
        }),
        ...leads.map((l: any) => {
          const lStart = l.expectedCloseDate
            ? new Date(l.expectedCloseDate)
            : new Date();
          const lEnd = new Date(lStart);
          lEnd.setHours(lEnd.getHours() + 1);

          return {
            id: `lead-${l.id}`,
            dbId: l.id,
            source: 'lead',
            title: `Follow up: ${l.name} (${l.company})`,
            description: null,
            startTime: lStart.toISOString(),
            endTime: lEnd.toISOString(),
            isAllDay: false,
            type: 'FOLLOW_UP',
            status: l.stage,
            location: null,
            isOnline: false,
            assignedToId: l.assignedToId,
            relatedLead: { id: l.id, name: l.name, company: l.company },
          };
        }),
      ];

      return calendarEvents;
    });
  }
}
