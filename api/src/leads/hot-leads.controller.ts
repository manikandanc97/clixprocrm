import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { LeadsService } from './services/leads.service';

@Controller('crm/hot-leads')
@UseGuards(SupabaseAuthGuard, TenantGuard)
export class HotLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getHotLeads(@Req() req: any) {
    const leads = await this.leadsService.getHotLeads(req.tenantId);
    return { success: true, data: { leads } };
  }
}
