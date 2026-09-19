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
    const leads = await this.prisma.lead.findMany({ where: { tenantId } });
    
    let createdCount = 0;
    for (const lead of leads) {
      const existingDeal = await this.prisma.deal.findFirst({
        where: { tenantId, leadId: lead.id }
      });
      if (!existingDeal) {
        await this.prisma.deal.create({
          data: {
            tenantId,
            name: `${lead.name} - Deal`,
            companyId: lead.companyId,
            customerId: lead.customerId,
            leadId: lead.id,
            value: lead.value,
            ownerId: lead.assignedToId || lead.createdById,
            stage: 'NEW',
          }
        });
        createdCount++;
      }
    }
    return { success: true, createdCount, totalLeads: leads.length };
  }
}
