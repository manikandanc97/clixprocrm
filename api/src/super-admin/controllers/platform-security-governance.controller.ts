import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RequireAal } from '../../auth/aal.decorator';
import { AalGuard } from '../../auth/aal.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { SecurityGovernanceService } from '../services/security-governance.service';
import { SecurityOperationsService } from '../services/security-operations.service';

@Controller([
  'super-admin/security/governance',
  'super_admin/security/governance',
])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard, AalGuard)
@RequireAal('aal2')
export class PlatformSecurityGovernanceController {
  constructor(
    private readonly governanceService: SecurityGovernanceService,
    private readonly secOpsService: SecurityOperationsService,
  ) {}

  @Get('posture')
  async getPosture() {
    const data = await this.governanceService.getSecurityPosture();
    return { success: true, data };
  }

  @Get('controls')
  async getControls() {
    const data = await this.governanceService.getControlInventory();
    return { success: true, data };
  }

  @Get('config')
  getConfig() {
    const data = this.secOpsService.getSecurityConfig();
    return { success: true, data };
  }

  @Get('rls')
  async getRls() {
    const data = await this.governanceService.getRlsGovernance();
    return { success: true, data };
  }

  @Get('readiness')
  async getReadiness() {
    const data = await this.governanceService.calculateReadinessScore();
    return { success: true, data };
  }

  @Post('evidence')
  async generateEvidence(@Body() body?: { format?: 'json' | 'csv' }) {
    const format = body?.format || 'json';
    const data = await this.governanceService.generateEvidenceReport(format);
    return { success: true, data };
  }
}
