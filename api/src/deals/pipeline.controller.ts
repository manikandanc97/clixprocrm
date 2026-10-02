import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsService } from './services/deals.service';
import { PipelineService } from './services/pipeline.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('crm/pipeline')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly dealsService: DealsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getPipeline(@Req() req: any) {
    const data = await this.pipelineService.getPipeline(req.tenantId);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateDealStage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateDealDto,
  ) {
    const data = await this.dealsService.updateDeal(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Post('migrate-leads')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async migrateLeadsToDeals(@Req() req: any) {
    const tenantId = req.tenantId;
    let createdCount = 0;
    let totalLeads = 0;
    let cursor: string | undefined = undefined;

    while (true) {
      const queryArgs: any = {
        where: { tenantId },
        take: 100,
        orderBy: { id: 'asc' },
      };
      if (cursor) {
        queryArgs.skip = 1;
        queryArgs.cursor = { id: cursor };
      }

      const leads = await this.prisma.lead.findMany(queryArgs);

      if (leads.length === 0) break;
      totalLeads += leads.length;
      cursor = leads[leads.length - 1].id;

      const leadIds = leads.map((l: any) => l.id);

      const existingDeals = await this.prisma.deal.findMany({
        where: { tenantId, leadId: { in: leadIds } },
        select: { leadId: true },
      });

      const existingDealLeadIds = new Set(existingDeals.map((d) => d.leadId));

      const dealsToCreate = leads
        .filter((lead: any) => !existingDealLeadIds.has(lead.id))
        .map((lead: any) => ({
          tenantId,
          name: `${lead.name} - Deal`,
          companyId: lead.companyId,
          customerId: lead.customerId,
          leadId: lead.id,
          value: lead.value,
          ownerId: lead.assignedToId || lead.createdById,
          stage: 'NEW' as any,
        }));

      if (dealsToCreate.length > 0) {
        await this.prisma.deal.createMany({
          data: dealsToCreate,
          skipDuplicates: true,
        });
        createdCount += dealsToCreate.length;
      }
    }

    return { success: true, createdCount, totalLeads };
  }
}
