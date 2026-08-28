import { Controller, Get, Patch, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
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

  @Post('test')
  async createTestNotification(@Req() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const notification = await this.notificationsService.createTestNotification(tenantId, userId);
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
  async deleteNotification(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(tenantId, userId, id);
    return { success: true };
  }
}
