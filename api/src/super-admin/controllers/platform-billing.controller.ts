import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  PlatformBillingService,
  CreatePlatformSubscriptionDto,
  ProcessPlatformRefundDto,
  UpdatePlatformBillingConfigDto,
} from '../services/platform-billing.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('super-admin/billing')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PlatformBillingController {
  constructor(private readonly billingService: PlatformBillingService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async getOverview() {
    const data = await this.billingService.getOverview();
    return { success: true, data };
  }

  @Get('subscriptions')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async getSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('planId') planId?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const data = await this.billingService.getSubscriptions(p, l, { search, planId, status });
    return { success: true, ...data };
  }

  @Post('subscriptions')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async createSubscription(
    @Req() req: any,
    @Body() body: CreatePlatformSubscriptionDto,
  ) {
    const result = await this.billingService.createOrUpdateSubscription(
      req.user.sub,
      body,
    );
    return { success: true, data: result };
  }

  @Get('invoices')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async getInvoices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const data = await this.billingService.getPlatformInvoices(p, l, {
      search,
      status,
      paymentStatus,
      tenantId,
    });
    return { success: true, ...data };
  }

  @Get('invoices/:id')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async getInvoiceById(@Param('id') id: string) {
    const invoice = await this.billingService.getPlatformInvoiceById(id);
    return { success: true, data: invoice };
  }

  @Post('invoices/:id/refund')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async processRefund(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ProcessPlatformRefundDto,
  ) {
    const refund = await this.billingService.processPlatformRefund(
      id,
      req.user.sub,
      body,
    );
    return { success: true, data: refund };
  }

  @Get('settings')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async getSettings() {
    const config = await this.billingService.getBillingConfig();
    return { success: true, data: config };
  }

  @Put('settings')
  @Roles('SUPER_ADMIN', 'SUPERADMIN')
  async updateSettings(
    @Req() req: any,
    @Body() body: UpdatePlatformBillingConfigDto,
  ) {
    const config = await this.billingService.updateBillingConfig(
      req.user.sub,
      body,
    );
    return { success: true, data: config };
  }
}
