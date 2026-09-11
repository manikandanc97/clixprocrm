import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MeetingsService } from './services/meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('crm/meetings')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getMeetings(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.meetingsService.getMeetings(
      req.tenantId,
      req.user,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async createMeeting(@Req() req: any, @Body() body: CreateMeetingDto) {
    const data = await this.meetingsService.createMeeting(
      req.tenantId,
      req.user,
      body,
    );
    return { success: true, data };
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async updateMeeting(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateMeetingDto,
  ) {
    const data = await this.meetingsService.updateMeeting(
      req.tenantId,
      req.user,
      id,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async deleteMeeting(@Req() req: any, @Param('id') id: string) {
    await this.meetingsService.deleteMeeting(req.tenantId, req.user, id);
    return {
      success: true,
      message: 'Meeting deleted or cancelled successfully',
    };
  }
}
