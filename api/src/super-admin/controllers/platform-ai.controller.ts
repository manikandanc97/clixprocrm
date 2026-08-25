import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlatformAiService } from '../services/platform-ai.service';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';

@Controller('super-admin/ai')
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformAiController {
  constructor(private readonly platformAiService: PlatformAiService) {}

  @Get('models')
  async getAiModels() {
    const models = await this.platformAiService.getAiModels();
    return { success: true, models };
  }

  @Get('plans')
  async getPlanAiOverview() {
    const overview = await this.platformAiService.getPlanAiOverview();
    return { success: true, ...overview };
  }

  @Patch('plans/:planId/default-model')
  async setPlanDefaultModel(
    @Param('planId') planId: string,
    @Body('modelId') modelId: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const res = await this.platformAiService.setPlanDefaultModel(
      planId,
      modelId,
      actorId,
    );
    return res;
  }

  @Put('plans/:planId')
  async updatePlanAiConfiguration(
    @Param('planId') planId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const res = await this.platformAiService.updatePlanAiConfiguration(
      planId,
      body,
      actorId,
    );
    return res;
  }

  @Patch('models/:id/availability')
  async toggleAvailability(
    @Param('id') modelId: string,
    @Body('isAvailable') isAvailable: boolean,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const model = await this.platformAiService.toggleModelAvailability(
      modelId,
      isAvailable,
      actorId,
    );
    return { success: true, model };
  }

  @Patch('models/:id/status')
  async updateModelStatus(
    @Param('id') modelId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const model = await this.platformAiService.updateModelStatus(
      modelId,
      status,
      actorId,
    );
    return { success: true, model };
  }

  @Patch('global')
  async toggleGlobalAiKillswitch(
    @Body('enabled') enabled: boolean,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub;
    const res = await this.platformAiService.toggleGlobalAiKillswitch(
      enabled,
      actorId,
    );
    return res;
  }

  @Post('models/:id/set-default')
  async setDefaultModel(@Param('id') modelId: string, @Req() req: any) {
    const actorId = req.user?.id || req.user?.sub;
    const res = await this.platformAiService.setDefaultModel(modelId, actorId);
    return res;
  }

  @Post('models/:id/set-fallback')
  async setFallbackModel(@Param('id') modelId: string, @Req() req: any) {
    const actorId = req.user?.id || req.user?.sub;
    const res = await this.platformAiService.setFallbackModel(modelId, actorId);
    return res;
  }

  @Get('entitlements')
  async getPlanAiEntitlements() {
    const data = await this.platformAiService.getPlanAiOverview();
    return { success: true, ...data };
  }

  @Get('usage')
  async getAiUsageTelemetry(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const telemetry = await this.platformAiService.getAiUsageTelemetry(parsedLimit);
    return { success: true, ...telemetry };
  }
}

