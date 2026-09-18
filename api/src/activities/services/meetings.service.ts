import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { formatDate } from '../../common/utils/crm-formatters.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingDto } from '../dto/create-meeting.dto';
import { UpdateMeetingDto } from '../dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  private async checkConflict(
    tx: any,
    tenantId: string,
    ownerId: string,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string,
  ) {
    const conflict = await tx.meeting.findFirst({
      where: {
        tenantId,
        ownerId,
        status: { not: 'CANCELLED' },
        ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
        OR: [
          { startTime: { lt: endTime, gte: startTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });
    if (conflict) {
      throw new HttpException(
        {
          success: false,
          message: 'Scheduling conflict detected for the owner.',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private async getManagedUsers(tx: any, tenantId: string, userId: string) {
    const subordinates = await tx.tenantUser.findMany({
      where: { tenantId, reportingManagerId: userId },
    });
    return subordinates.map((s: any) => s.userId);
  }

  async createMeeting(tenantId: string, user: any, data: CreateMeetingDto) {
    const userId = user.id || user.sub;
    const ownerId = data.ownerId || userId;
    const assignedToId = data.assignedToId || userId;

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      await this.checkConflict(tx, tenantId, ownerId, start, end);

      // @ts-ignore
      const meeting = await tx.meeting.create({
        data: {
          tenantId,
          title: data.title,
          startTime: start,
          endTime: end,
          location: this.enc.encrypt(data.location || null),
          isOnline: data.isOnline || false,
          type: data.type || 'MEETING',
          description: this.enc.encrypt(data.description || null),
          isAllDay: data.isAllDay || false,
          assignedToId: assignedToId,
          ownerId: ownerId,
          visibility: data.visibility || 'PRIVATE',
          leadId: data.leadId || null,
          customerId: data.customerId || null,
          quotationId: data.quotationId || null,
          dealId: data.dealId || null,
          status: data.isLog ? 'COMPLETED' : data.status || 'SCHEDULED',
          duration: data.duration || 30,
          meetingNotes: this.enc.encrypt(data.meetingNotes || null),
        },
        include: {
          assignedTo: { select: { name: true, email: true, id: true } },
        },
      });

      if (data.leadId) {
        await tx.timelineEvent.create({
          data: {
            tenantId,
            leadId: data.leadId,
            userId,
            action: data.isLog ? 'Meeting Logged' : 'Meeting Scheduled',
            description: `${data.isLog ? 'Logged' : 'Scheduled'} meeting: ${meeting.title}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'MEETING_CREATED',
          module: 'CALENDAR',
          details: { meetingId: meeting.id },
        },
      });

      return meeting;
    });
  }

  async updateMeeting(
    tenantId: string,
    user: any,
    id: string,
    data: UpdateMeetingDto,
  ) {
    const userId = user.id || user.sub;
    const rawRole =
      typeof user.role === 'object'
        ? user.role?.name || ''
        : String(user.role || '');
    const role = rawRole.toUpperCase().replace(/[\s_]+/g, '');
    const isAdmin =
      role === 'ADMIN' || role === 'SUPERADMIN' || role === 'OWNER';

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      // @ts-ignore
      const existing = await tx.meeting.findUnique({ where: { id, tenantId } });
      if (!existing)
        throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);

      // RBAC Edit check
      const isOwner =
        existing.ownerId === userId || existing.assignedToId === userId;
      let isManager = false;

      if (role === 'MANAGER') {
        const managed = await this.getManagedUsers(tx, tenantId, userId);
        if (
          managed.includes(existing.ownerId) ||
          managed.includes(existing.assignedToId)
        )
          isManager = true;
      }

      if (!isOwner && !isAdmin && !isManager) {
        throw new HttpException(
          'Forbidden: Cannot edit this meeting',
          HttpStatus.FORBIDDEN,
        );
      }

      if (data.startTime && data.endTime) {
        await this.checkConflict(
          tx,
          tenantId,
          existing.ownerId || existing.assignedToId || userId,
          new Date(data.startTime),
          new Date(data.endTime),
          id,
        );
      }

      const updateData: any = {
        ...(data.title && { title: data.title }),
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(data.endTime && { endTime: new Date(data.endTime) }),
        ...(data.location !== undefined && {
          location: this.enc.encrypt(data.location),
        }),
        ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
        ...(data.description !== undefined && {
          description: this.enc.encrypt(data.description),
        }),
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
        ...(data.status && { status: data.status }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.ownerId && { ownerId: data.ownerId }),
      };

      if (
        data.startTime &&
        new Date(data.startTime).getTime() !== existing.startTime.getTime()
      ) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'MEETING_RESCHEDULED',
            module: 'CALENDAR',
            details: {
              meetingId: id,
              oldStartAt: existing.startTime,
              newStartAt: data.startTime,
            },
          },
        });
      }

      // @ts-ignore
      const updated = await tx.meeting.update({
        where: { id, tenantId },
        data: updateData,
      });

      return updated;
    });
  }

  async deleteMeeting(tenantId: string, user: any, id: string) {
    const userId = user.id || user.sub;
    const rawRole =
      typeof user.role === 'object'
        ? user.role?.name || ''
        : String(user.role || '');
    const role = rawRole.toUpperCase().replace(/[\s_]+/g, '');
    const isAdmin =
      role === 'ADMIN' || role === 'SUPERADMIN' || role === 'OWNER';

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      // @ts-ignore
      const existing = await tx.meeting.findUnique({ where: { id, tenantId } });
      if (!existing)
        throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);

      const isOwner =
        existing.ownerId === userId || existing.assignedToId === userId;
      let isManager = false;

      if (role === 'MANAGER') {
        const managed = await this.getManagedUsers(tx, tenantId, userId);
        if (managed.includes(existing.ownerId)) isManager = true;
      }

      if (!isOwner && !isAdmin && !isManager) {
        throw new HttpException(
          'Forbidden: Cannot delete this meeting',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existing.status === 'COMPLETED') {
        throw new HttpException(
          'Cannot delete a completed meeting, business history must be preserved.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // @ts-ignore
      return tx.meeting.update({
        where: { id, tenantId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    });
  }

  async getMeetings(
    tenantId: string,
    user: any,
    startDate?: string,
    endDate?: string,
  ) {
    const userId = user.id || user.sub;
    const rawRole =
      typeof user.role === 'object'
        ? user.role?.name || ''
        : String(user.role || '');
    const role = rawRole.toUpperCase().replace(/[\s_]+/g, '');
    const isAdmin =
      role === 'ADMIN' || role === 'SUPERADMIN' || role === 'OWNER';

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(new Date().setMonth(new Date().getMonth() + 1));

    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const managedUsers =
        role === 'MANAGER'
          ? await this.getManagedUsers(tx, tenantId, userId)
          : [];

      // Fetch meetings and calendar-dated tasks in parallel
      const [meetings, tasks] = await Promise.all([
        tx.meeting.findMany({
          where: {
            tenantId,
            startTime: { gte: start },
            endTime: { lte: end },
            OR: [
              { ownerId: userId },
              { assignedToId: userId },
              { visibility: 'ORGANIZATION' },
              { visibility: 'TEAM', ownerId: { in: managedUsers } },
              ...(isAdmin ? [{ id: { not: '' } }] : []),
            ],
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true,
            isOnline: true,
            status: true,
            type: true,
            visibility: true,
            ownerId: true,
            assignedTo: { select: { id: true, name: true } },
          },
        }),
        tx.task.findMany({
          where: {
            tenantId,
            dueDate: { gte: start, lte: end },
            deletedAt: null,
            OR: [
              { assignedToId: userId },
              { createdById: userId },
              ...(role === 'MANAGER'
                ? [{ assignedToId: { in: managedUsers } }]
                : []),
              ...(isAdmin ? [{ id: { not: '' } }] : []),
            ],
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
            priority: true,
            assignedTo: { select: { id: true, name: true } },
          },
        }),
      ]);

      const mappedMeetings = meetings.map((m: any) => ({
        id: m.id,
        title:
          m.visibility === 'PRIVATE' && m.ownerId !== userId && !isAdmin
            ? 'Busy'
            : m.title,
        date: formatDate(m.startTime),
        startTime: m.startTime,
        endTime: m.endTime,
        location: this.enc.decrypt(m.location) || 'Virtual',
        isOnline: m.isOnline,
        status: m.status,
        type: m.type,
        isToday: false,
        attendees: m.assignedTo ? [m.assignedTo] : [],
        color: m.status === 'CANCELLED' ? '#ef4444' : '#2563eb',
        isTask: false,
      }));

      const mappedTasks = tasks.map((t: any) => ({
        id: t.id,
        title: `Task Due: ${t.title}`,
        date: formatDate(t.dueDate),
        startTime: t.dueDate,
        endTime: t.dueDate,
        location: 'Task',
        isOnline: false,
        status: t.status,
        type: 'TASK_DEADLINE',
        isToday: false,
        attendees: t.assignedTo ? [t.assignedTo] : [],
        color: t.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
        isTask: true,
      }));

      return [...mappedMeetings, ...mappedTasks].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    });
  }

  async getLeadMeetings(tenantId: string, leadId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx: any) => {
      const meetings = await tx.meeting.findMany({
        where: { tenantId, leadId },
        include: {
          assignedTo: { select: { name: true, email: true, id: true } },
        },
        orderBy: { startTime: 'desc' },
      });
      // Decrypt sensitive meeting fields
      return meetings.map((m: any) => ({
        ...m,
        location: this.enc.decrypt(m.location),
        description: this.enc.decrypt(m.description),
        meetingNotes: this.enc.decrypt(m.meetingNotes),
      }));
    });
  }
}
