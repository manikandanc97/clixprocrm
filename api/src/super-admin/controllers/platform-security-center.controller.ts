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
import { EmergencySecurityService } from '../services/emergency-security.service';
import { SecurityIncidentsService } from '../services/security-incidents.service';
import type {
  CreateIncidentDto,
  ListIncidentsDto,
} from '../services/security-incidents.service';

@Controller([
  'super-admin/security',
  'super_admin/security',
])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard, AalGuard)
@RequireAal('aal2')
export class PlatformSecurityCenterController {
  constructor(
    private readonly incidentsService: SecurityIncidentsService,
    private readonly emergencyService: EmergencySecurityService,
  ) {}

  // 1. Security Center Status
  @Get('center/status')
  async getStatus() {
    const data = await this.incidentsService.getSecurityCenterStatus();
    return { success: true, data };
  }

  // 2. Security Incident Management
  @Get('incidents')
  async listIncidents(@Query() query: ListIncidentsDto) {
    const data = await this.incidentsService.listIncidents(query);
    return { success: true, data };
  }

  @Get('incidents/:id')
  async getIncident(@Param('id') id: string) {
    const data = await this.incidentsService.getIncidentById(id);
    return { success: true, data };
  }

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  async createIncident(@Body() body: CreateIncidentDto, @Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.incidentsService.createIncident(body, actorId);
    return { success: true, data };
  }

  @Patch('incidents/:id/acknowledge')
  async acknowledgeIncident(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.incidentsService.acknowledgeIncident(id, actorId);
    return { success: true, data };
  }

  @Patch('incidents/:id/status')
  async updateIncidentStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.incidentsService.updateIncidentStatus(
      id,
      body.status,
      body.notes,
      actorId,
    );
    return { success: true, data };
  }

  @Post('incidents/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveIncident(
    @Param('id') id: string,
    @Body() body: { resolutionNotes: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.incidentsService.resolveIncident(
      id,
      body.resolutionNotes,
      actorId,
    );
    return { success: true, data };
  }

  // 3. Emergency Security Controls
  @Post('emergency/revoke-user/:userId')
  @HttpCode(HttpStatus.OK)
  async emergencyRevokeUser(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.revokeUserSessions(
      userId,
      body.reason,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/lock-user/:userId')
  @HttpCode(HttpStatus.OK)
  async emergencyLockUser(
    @Param('userId') userId: string,
    @Body() body: { reason: string; confirmation: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.lockUser(
      userId,
      body.reason,
      body.confirmation,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/unlock-user/:userId')
  @HttpCode(HttpStatus.OK)
  async emergencyUnlockUser(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.unlockUser(
      userId,
      body.reason,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/lock-tenant/:tenantId')
  @HttpCode(HttpStatus.OK)
  async emergencyLockTenant(
    @Param('tenantId') tenantId: string,
    @Body() body: { reason: string; confirmation: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.lockTenant(
      tenantId,
      body.reason,
      body.confirmation,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/unlock-tenant/:tenantId')
  @HttpCode(HttpStatus.OK)
  async emergencyUnlockTenant(
    @Param('tenantId') tenantId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.unlockTenant(
      tenantId,
      body.reason,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/generate-break-glass-code')
  @HttpCode(HttpStatus.OK)
  async generateBreakGlassCode(@Req() req: any) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const code = await this.emergencyService.generateBreakGlassCode(actorId);
    return { success: true, data: { confirmationCode: code } };
  }

  @Post('emergency/platform-lockdown')
  @HttpCode(HttpStatus.OK)
  async enablePlatformEmergency(
    @Body() body: { reason: string; confirmation: string; confirmationCode: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.enablePlatformEmergency(
      body.reason,
      body.confirmation,
      body.confirmationCode,
      actorId,
    );
    return { success: true, data };
  }

  @Post('emergency/platform-unlock')
  @HttpCode(HttpStatus.OK)
  async disablePlatformEmergency(
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'SUPER_ADMIN';
    const data = await this.emergencyService.disablePlatformEmergency(
      body.reason,
      actorId,
    );
    return { success: true, data };
  }
}
