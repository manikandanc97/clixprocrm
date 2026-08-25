import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionEntitlementService } from '../../common/plans/subscription-entitlement.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

export class CalculateQuoteDto {
  planId: string;
  seats?: number;
  billingCycle?: 'monthly' | 'annual';
}

export class ChangePlanDto {
  planId: string;
  seats?: number;
  billingCycle?: 'monthly' | 'annual';
}

export class EnterpriseInquiryDto {
  message?: string;
  teamSize?: string;
  phone?: string;
}

@Controller('crm/subscription')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class SubscriptionController {
  constructor(
    private readonly entitlementService: SubscriptionEntitlementService,
  ) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'EMPLOYEE', 'USER')
  async getSubscription(@Req() req: any) {
    const data = await this.entitlementService.getWorkspaceSubscription(
      req.tenantId,
    );
    return { success: true, data };
  }

  @Post('quote')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'EMPLOYEE', 'USER')
  async calculateQuote(@Req() req: any, @Body() body: CalculateQuoteDto) {
    if (!body?.planId) {
      throw new BadRequestException('planId is required.');
    }
    const data = await this.entitlementService.calculateQuote(
      req.tenantId,
      body.planId,
      body.seats,
      body.billingCycle || 'monthly',
    );
    return { success: true, data };
  }

  @Get('invoices')
  @Roles('ADMIN')
  async getInvoices(@Req() req: any) {
    const data = await this.entitlementService.getWorkspaceInvoices(
      req.tenantId,
    );
    return { success: true, data };
  }

  @Post('change-plan')
  @Roles('ADMIN')
  async changePlan(@Req() req: any, @Body() body: ChangePlanDto) {
    if (!body?.planId) {
      throw new BadRequestException('planId is required.');
    }
    const data = await this.entitlementService.changePlan(
      req.tenantId,
      body.planId,
      body.billingCycle || 'monthly',
      body.seats,
    );
    return {
      success: true,
      message: `Successfully switched to ${data.planName} plan.`,
      data,
    };
  }

  @Post('contact-sales')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'EMPLOYEE', 'USER')
  async contactSales(@Req() req: any, @Body() body: EnterpriseInquiryDto) {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.entitlementService.submitEnterpriseInquiry(
      req.tenantId,
      userId,
      body,
    );
    return result;
  }
}

