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
    UseGuards
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import {
    UpdateQuotationDto,
    UpdateQuotationStatusDto,
} from '../dto/update-quotation.dto';
import { QuotationsService } from '../services/quotations.service';

@Controller('crm/quotations')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'EMPLOYEE')
  async getQuotations(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { page: p, limit: l } = parsePaginationParams({ page, limit }, 10);
    const quotations = await this.quotationsService.getQuotations(
      req.tenantId,
      p,
      l,
      search || '',
    );
    return { success: true, data: quotations };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createQuotation(@Req() req: any, @Body() body: CreateQuotationDto) {
    const quotation = await this.quotationsService.createQuotation(
      req.tenantId,
      body,
    );
    return { success: true, data: quotation };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateQuotation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateQuotationDto,
  ) {
    const quotation = await this.quotationsService.updateQuotation(
      req.tenantId,
      id,
      body,
    );
    return { success: true, data: quotation };
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateQuotationStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateQuotationStatusDto,
  ) {
    const quotation = await this.quotationsService.updateQuotationStatus(
      req.tenantId,
      id,
      body,
    );
    return { success: true, data: quotation };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async deleteQuotation(@Req() req: any, @Param('id') id: string) {
    await this.quotationsService.deleteQuotation(req.tenantId, id);
    return { success: true, data: { id } };
  }
}
