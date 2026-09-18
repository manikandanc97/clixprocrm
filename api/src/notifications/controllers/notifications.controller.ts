import {
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { NotificationsService } from '../services/notifications.service';

interface AuthenticatedRequest extends FastifyRequest {
  tenantId: string;
  user: { id: string };
}

@Controller('crm/notifications')
@UseGuards(SupabaseAuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const data = await this.notificationsService.getNotifications(
      tenantId,
      userId,
    );
    return { success: true, data };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const unreadCount = await this.notificationsService.getUnreadCount(
      tenantId,
      userId,
    );
    return { success: true, data: { unreadCount } };
  }

  @Post('test')
  async createTestNotification(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const notification = await this.notificationsService.createTestNotification(
      tenantId,
      userId,
    );
    return { success: true, data: notification };
  }

  @Patch('mark-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    await this.notificationsService.markAllAsRead(tenantId, userId);
    return { success: true };
  }

  @Delete('clear-read')
  async clearAllRead(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    await this.notificationsService.clearAllRead(tenantId, userId);
    return { success: true };
  }

  @Patch(':id')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    await this.notificationsService.markAsRead(tenantId, userId, id);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(tenantId, userId, id);
    return { success: true };
  }
}
