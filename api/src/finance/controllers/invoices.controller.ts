import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';
import {
    CreateInvoiceDto,
    SendInvoiceEmailDto,
    UpdateInvoiceDto,
} from '../dto/enterprise-invoice.dto';
import { InvoicesService } from '../services/invoices.service';

@Controller('crm/invoices')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getInvoices(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('companyId') companyId?: string,
    @Query('dealId') dealId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { page: p, limit: l } = parsePaginationParams({ page, limit }, 20);
    const data = await this.invoicesService.getInvoices(req.tenantId, p, l, {
      search,
      status,
      customerId,
      companyId,
      dealId,
      dateFrom,
      dateTo,
    });
    return { success: true, ...data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createInvoice(@Req() req: any, @Body() body: CreateInvoiceDto) {
    const invoice = await this.invoicesService.createInvoice(
      req.tenantId,
      req.user.sub,
      body,
    );
    return { success: true, data: invoice };
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getInvoiceById(@Req() req: any, @Param('id') id: string) {
    const invoice = await this.invoicesService.getInvoiceById(req.tenantId, id);
    if (!invoice) return { success: false, message: 'Invoice not found' };
    return { success: true, data: invoice };
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getInvoicePdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: FastifyReply,
  ) {
    const html = await this.invoicesService.generateInvoicePdf(
      req.tenantId,
      id,
    );
    res.header('Content-Type', 'text/html');
    return res.send(html);
  }

  @Post(':id/send')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async sendInvoice(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SendInvoiceEmailDto,
  ) {
    const result = await this.invoicesService.sendInvoice(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return result;
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateInvoice(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto & { status?: string },
  ) {
    if (body.status && Object.keys(body).length === 1) {
      const updated = await this.invoicesService.updateInvoiceStatus(
        req.tenantId,
        id,
        body.status,
        req.user.sub,
      );
      return { success: true, data: updated };
    }
    const invoice = await this.invoicesService.updateInvoice(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return { success: true, data: invoice };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteInvoice(@Req() req: any, @Param('id') id: string) {
    await this.invoicesService.deleteInvoice(req.tenantId, id, req.user.sub);
    return { success: true, data: { id } };
  }
}
