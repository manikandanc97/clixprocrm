import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { WorkspaceService } from '../services/workspace.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AalGuard } from '../../auth/aal.guard';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../common/utils/rate-limit.util';

@Controller('crm/settings')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard, AalGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Patch('workspace')
  @Roles('ADMIN')
  async updateWorkspace(@Req() req: any, @Body() data: any) {
    const updated = await this.workspaceService.updateWorkspace(
      req.tenantId,
      data,
    );
    return { success: true, data: updated };
  }

  @Get('ai')
  @Roles('ADMIN', 'MANAGER')
  async getAiSettings(@Req() req: any) {
    const ip = getClientIp(req);
    const identifier = `ai_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.AI);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.AI);

    const data = await this.settingsService.getAiSettings(req.tenantId);
    return { success: true, data };
  }

  @Patch('ai')
  @Roles('ADMIN', 'MANAGER')
  async updateAiSettings(@Req() req: any, @Body() data: any) {
    const updated = await this.settingsService.updateAiSettings(
      req.tenantId,
      data,
    );
    return { success: true, data: updated };
  }

  @Get('notifications')
  @Roles('ADMIN', 'MANAGER', 'USER', 'EMPLOYEE')
  async getNotificationSettings(@Req() req: any) {
    const data = await this.settingsService.getNotificationSettings(
      req.tenantId,
      req.user.id,
    );
    return { success: true, data };
  }

  @Patch('notifications')
  @Roles('ADMIN', 'MANAGER', 'USER', 'EMPLOYEE')
  async updateNotificationSettings(@Req() req: any, @Body() data: any) {
    const updated = await this.settingsService.updateNotificationSettings(
      req.tenantId,
      req.user.id,
      data,
    );
    return { success: true, data: updated };
  }
}
