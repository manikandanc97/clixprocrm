import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { RecordPaymentDto } from '../dto/enterprise-invoice.dto';

@Controller('crm/payments')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getPayments(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const data = await this.paymentsService.getPayments(req.tenantId, p, l, invoiceId, status);
    return { success: true, ...data };
  }

  @Post('invoice/:invoiceId')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async recordPayment(
    @Req() req: any,
    @Param('invoiceId') invoiceId: string,
    @Body() body: RecordPaymentDto,
  ) {
    const result = await this.paymentsService.recordPayment(
      req.tenantId,
      req.user.sub,
      invoiceId,
      body,
    );
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deletePayment(@Req() req: any, @Param('id') id: string) {
    const result = await this.paymentsService.deletePayment(
      req.tenantId,
      id,
      req.user.sub,
    );
    return { success: true, data: result };
  }
}
