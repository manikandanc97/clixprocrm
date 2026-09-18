import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { CalendarService } from './services/calendar.service';
import { MeetingsService } from './services/meetings.service';

@Controller('crm/calendar')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly meetingsService: MeetingsService,
  ) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getCalendarEvents(
    @Req() req: any,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!start || !end) {
      throw new HttpException(
        'Missing start or end date',
        HttpStatus.BAD_REQUEST,
      );
    }
    const data = await this.calendarService.getCalendarEvents(
      req.tenantId,
      req.user,
      start,
      end,
    );
    return data;
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async createCalendarEvent(@Req() req: any, @Body() body: any) {
    const { title, startTime, endTime } = body;
    if (!title || !startTime || !endTime) {
      throw new HttpException(
        'Missing required fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Reuse MeetingsService for meeting creation per the requirement
    const meetingData = {
      title,
      description: body.description,
      startTime,
      endTime,
      type: body.type || 'MEETING',
      isAllDay: body.isAllDay || false,
      assignedToId: body.assignedToId || req.user.sub,
      leadId: body.relatedLeadId || null,
      location: body.location,
      isOnline: body.isOnline || false,
      status: 'SCHEDULED',
    };

    const data = await this.meetingsService.createMeeting(
      req.tenantId,
      req.user.sub,
      meetingData,
    );
    return data;
  }
}
