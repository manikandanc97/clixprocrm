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
import { SuperAdminGuard } from '../../auth/super-admin.guard';

@Controller(['super-admin/billing', 'super_admin/billing'])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformBillingController {
  constructor(private readonly billingService: PlatformBillingService) {}

  @Get('overview')
  async getOverview() {
    const data = await this.billingService.getOverview();
    return { success: true, data };
  }

  @Get('subscriptions')
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
  async createSubscription(
    @Req() req: any,
    @Body() body: CreatePlatformSubscriptionDto,
  ) {
    const actorId = req.user?.id || req.user?.sub || 'SUPER_ADMIN';
    const result = await this.billingService.createOrUpdateSubscription(
      actorId,
      body,
    );
    return { success: true, data: result };
  }

  @Get('invoices')
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
  async getInvoiceById(@Param('id') id: string) {
    const invoice = await this.billingService.getPlatformInvoiceById(id);
    return { success: true, data: invoice };
  }

  @Post('invoices/:id/refund')
  async processRefund(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ProcessPlatformRefundDto,
  ) {
    const actorId = req.user?.id || req.user?.sub || 'SUPER_ADMIN';
    const refund = await this.billingService.processPlatformRefund(
      id,
      actorId,
      body,
    );
    return { success: true, data: refund };
  }

  @Get('settings')
  async getSettings() {
    const config = await this.billingService.getBillingConfig();
    return { success: true, data: config };
  }

  @Put('settings')
  async updateSettings(
    @Req() req: any,
    @Body() body: UpdatePlatformBillingConfigDto,
  ) {
    const actorId = req.user?.id || req.user?.sub || 'SUPER_ADMIN';
    const config = await this.billingService.updateBillingConfig(
      actorId,
      body,
    );
    return { success: true, data: config };
  }
}

