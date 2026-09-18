import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { UpdateInvoiceSettingsDto } from '../dto/enterprise-invoice.dto';
import { InvoiceSettingsService } from '../services/invoice-settings.service';

@Controller('crm/invoice-settings')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class InvoiceSettingsController {
  constructor(private readonly settingsService: InvoiceSettingsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getSettings(@Req() req: any) {
    const settings = await this.settingsService.getSettings(req.tenantId);
    return { success: true, data: settings };
  }

  @Put()
  @Roles('ADMIN', 'MANAGER')
  async updateSettings(
    @Req() req: any,
    @Body() body: UpdateInvoiceSettingsDto,
  ) {
    const settings = await this.settingsService.updateSettings(
      req.tenantId,
      req.user.sub,
      body,
    );
    return { success: true, data: settings };
  }
}
