import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import {
  PlatformSupportTicketsService,
  TicketListQueryDto,
} from '../services/platform-support-tickets.service';
import { SupportTicketStatus } from '@prisma/client';

@Controller('super-admin/support')
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformSupportTicketsController {
  constructor(
    private readonly supportTicketsService: PlatformSupportTicketsService,
  ) {}

  @Get('stats')
  async getStats() {
    const stats = await this.supportTicketsService.getSupportStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('tickets')
  async listTickets(@Query() query: TicketListQueryDto) {
    const data = await this.supportTicketsService.listTickets(query);
    return {
      success: true,
      data,
    };
  }

  @Get('tickets/:id')
  async getTicketDetails(@Param('id') id: string) {
    const ticket = await this.supportTicketsService.getTicketDetails(id);
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets/:id/reply')
  async addReply(
    @Param('id') id: string,
    @Body() body: { message: string; isInternal?: boolean },
    @Req() req: any,
  ) {
    if (!body?.message || !body.message.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }
    const adminUserId = req.user.id;
    const ticket = await this.supportTicketsService.addReplyOrNote(
      id,
      adminUserId,
      body.message,
      Boolean(body.isInternal),
    );
    return {
      success: true,
      data: ticket,
    };
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: SupportTicketStatus },
    @Req() req: any,
  ) {
    const validStatuses = Object.values(SupportTicketStatus);
    if (!body?.status || !validStatuses.includes(body.status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }
    const adminUserId = req.user.id;
    const ticket = await this.supportTicketsService.updateTicketStatus(
      id,
      adminUserId,
      body.status,
    );
    return {
      success: true,
      data: ticket,
    };
  }

  @Patch('tickets/:id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body() body: { assignedToId: string | null },
    @Req() req: any,
  ) {
    const adminUserId = req.user.id;
    const ticket = await this.supportTicketsService.assignTicket(
      id,
      adminUserId,
      body.assignedToId || null,
    );
    return {
      success: true,
      data: ticket,
    };
  }
}
