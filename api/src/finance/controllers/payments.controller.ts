import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';
import { RecordPaymentDto } from '../dto/enterprise-invoice.dto';
import { PaymentsService } from '../services/payments.service';

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
    const { page: p, limit: l } = parsePaginationParams({ page, limit }, 20);
    const data = await this.paymentsService.getPayments(
      req.tenantId,
      p,
      l,
      invoiceId,
      status,
    );
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
