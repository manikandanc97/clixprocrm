import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { SubscriptionEntitlementService } from '../../common/plans/subscription-entitlement.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

export class CalculateQuoteDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsString()
  billingCycle?: 'monthly' | 'annual';
}

export class CreateCheckoutOrderDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsString()
  billingCycle?: 'monthly' | 'annual';
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsOptional()
  @IsString()
  billingCycle?: 'monthly' | 'annual';

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;
}

export class SwitchCycleDto {
  @IsString()
  @IsNotEmpty()
  billingCycle: 'monthly' | 'annual';
}

export class ChangePlanDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsString()
  billingCycle?: 'monthly' | 'annual';
}

export class EnterpriseInquiryDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  teamSize?: string;

  @IsOptional()
  @IsString()
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

  @Post('create-checkout-order')
  @Roles('ADMIN')
  async createCheckoutOrder(
    @Req() req: any,
    @Body() body: CreateCheckoutOrderDto,
  ) {
    if (!body?.planId) {
      throw new BadRequestException('planId is required.');
    }
    const userId = req.user?.id || req.user?.sub;
    const result = await this.entitlementService.createCheckoutOrder(
      req.tenantId,
      body.planId,
      body.seats,
      body.billingCycle || 'monthly',
      userId,
    );
    return { success: true, data: result };
  }

  @Post('verify-payment')
  @Roles('ADMIN')
  async verifyPayment(@Req() req: any, @Body() body: VerifyPaymentDto) {
    if (!body?.orderId || !body?.paymentId || !body?.signature || !body?.planId) {
      throw new BadRequestException('orderId, paymentId, signature, and planId are required.');
    }
    const userId = req.user?.id || req.user?.sub;
    const result = await this.entitlementService.verifyAndActivatePayment(
      req.tenantId,
      body,
      userId,
    );
    return {
      success: true,
      message: 'Payment verified and plan activated successfully.',
      data: result,
    };
  }

  @Post('switch-cycle')
  @Roles('ADMIN')
  async switchCycle(@Req() req: any, @Body() body: SwitchCycleDto) {
    if (!body?.billingCycle) {
      throw new BadRequestException('billingCycle is required.');
    }
    const userId = req.user?.id || req.user?.sub;
    const result = await this.entitlementService.switchBillingCycle(
      req.tenantId,
      body.billingCycle,
      userId,
    );
    return { success: true, data: result };
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
