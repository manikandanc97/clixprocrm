import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('crm/companies')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getCompanies(@Req() req: any, @Query() query: PaginationQueryDto) {
    const data = await this.companiesService.getCompanies(req.tenantId, query);
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createCompany(@Req() req: any, @Body() body: CreateCompanyDto) {
    const data = await this.companiesService.createCompany(
      req.tenantId,
      body,
      req.user.sub,
    );
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateCompany(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateCompanyDto>,
  ) {
    const data = await this.companiesService.updateCompany(
      req.tenantId,
      id,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteCompany(@Req() req: any, @Param('id') id: string) {
    const data = await this.companiesService.deleteCompany(req.tenantId, id);
    return { success: true, data };
  }

  @Post('bulk')
  @Roles('ADMIN', 'MANAGER')
  async bulkDeleteCompanies(@Req() req: any, @Body() body: { ids: string[] }) {
    const data = await this.companiesService.bulkDeleteCompanies(
      req.tenantId,
      body.ids || [],
    );
    return { success: true, data };
  }

  @Post('reassign-industry')
  @Roles('ADMIN', 'MANAGER')
  async reassignIndustry(
    @Req() req: any,
    @Body() body: { oldIndustry: string; newIndustry: string },
  ) {
    const data = await this.companiesService.reassignIndustry(
      req.tenantId,
      body.oldIndustry,
      body.newIndustry,
    );
    return { success: true, data };
  }

  @Post('merge')
  @Roles('ADMIN', 'MANAGER')
  async mergeCompanies(
    @Req() req: any,
    @Body() body: { primaryId: string; secondaryId: string },
  ) {
    const data = await this.companiesService.mergeCompanies(
      req.tenantId,
      body.primaryId,
      body.secondaryId,
    );
    return { success: true, data };
  }
}

