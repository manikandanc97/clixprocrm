import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { AalGuard } from '../../auth/aal.guard';
import { RequireAal } from '../../auth/aal.decorator';
import { SecurityOperationsService } from '../services/security-operations.service';
import { SecurityAlertsService } from '../services/security-alerts.service';
import { EmergencySecurityService } from '../services/emergency-security.service';
import type { ListSecurityAlertsDto } from '../services/security-alerts.service';

@Controller([
  'super-admin/security/operations',
  'super_admin/security/operations',
])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard, AalGuard)
@RequireAal('aal2')
export class PlatformSecurityOperationsController {
  constructor(
    private readonly secOpsService: SecurityOperationsService,
    private readonly alertsService: SecurityAlertsService,
    private readonly emergencyService: EmergencySecurityService,
  ) {}

  /**
   * Top 4 metrics and overall system status for the SecOps screen.
   */
  @Get('summary')
  async getSummary() {
    const data = await this.secOpsService.getSecOpsSummary();
    return { success: true, data };
  }

  /**
   * Real platform security health table (6 services: DB, Auth, Sessions, Storage, Background Jobs, Audit Logging).
   */
  @Get('health')
  async getHealth() {
    const data = await this.secOpsService.getPlatformSecurityHealth();
    return { success: true, data };
  }

  /**
   * Lists security alerts with filters (status, severity, search, pagination).
   */
  @Get('alerts')
  async listAlerts(@Query() query: ListSecurityAlertsDto) {
    const data = await this.alertsService.listAlerts(query);
    return { success: true, data };
  }

  /**
   * Runs an automated application-level security detection pass over audit events.
   */
  @Post('alerts/detect')
  @HttpCode(HttpStatus.OK)
  async runDetection(@Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.alertsService.runDetectionPass(actorId);
    return { success: true, data };
  }

  /**
   * Acknowledges an open security alert.
   */
  @Patch('alerts/:id/acknowledge')
  async acknowledgeAlert(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.alertsService.acknowledgeAlert(id, actorId);
    return { success: true, data };
  }

  /**
   * Resolves a security alert.
   */
  @Post('alerts/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.alertsService.resolveAlert(id, body?.notes, actorId);
    return { success: true, data };
  }

  /**
   * Escalates an alert to a full Security Incident.
   */
  @Post('alerts/:id/escalate')
  @HttpCode(HttpStatus.CREATED)
  async escalateAlert(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.alertsService.escalateAlertToIncident(id, actorId);
    return { success: true, data };
  }

  /**
   * Forces password reset on a user account from SecOps emergency controls.
   */
  @Post('emergency/force-password-reset/:userId')
  @HttpCode(HttpStatus.OK)
  async forcePasswordReset(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.forcePasswordReset(
      userId,
      body.reason,
      actorId,
    );
    return { success: true, data };
  }

  /**
   * Legacy and timeline support endpoints.
   */
  @Get('metrics')
  async getMetrics(@Query('period') period?: '24h' | '7d' | '30d') {
    const data = await this.secOpsService.getSecurityMetrics(period || '24h');
    return { success: true, data };
  }

  @Get('timeline')
  async getTimeline(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 25;
    const data = await this.secOpsService.getSecurityTimeline(limitNum);
    return { success: true, data };
  }

  @Get('config')
  getConfig() {
    const data = this.secOpsService.getSecurityConfig();
    return { success: true, data };
  }
}
