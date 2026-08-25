import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  PlatformPlansService,
  CreatePlatformPlanDto,
  UpdatePlatformPlanDto,
} from '../services/platform-plans.service';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';

@Controller('super-admin/plans')
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformPlansController {
  constructor(private readonly platformPlansService: PlatformPlansService) {}

  @Get()
  async getPlans() {
    const data = await this.platformPlansService.getPlans();
    return { success: true, ...data };
  }

  @Post()
  async createPlan(
    @Body() body: CreatePlatformPlanDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const plan = await this.platformPlansService.createPlan(body, actorId);
    return { success: true, plan, message: 'Plan created successfully.' };
  }

  @Put(':id')
  async updatePlan(
    @Param('id') planId: string,
    @Body() body: UpdatePlatformPlanDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const updated = await this.platformPlansService.updatePlan(
      planId,
      body,
      actorId,
    );
    return { success: true, plan: updated, message: 'Plan updated successfully.' };
  }

  @Patch(':id/archive')
  async archivePlan(
    @Param('id') planId: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const updated = await this.platformPlansService.archivePlan(planId, actorId);
    return { success: true, plan: updated, message: 'Plan archived successfully.' };
  }

  @Delete(':id')
  async deletePlan(
    @Param('id') planId: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const result = await this.platformPlansService.deletePlan(planId, actorId);
    return { success: true, ...result, message: 'Plan deleted successfully.' };
  }
}

