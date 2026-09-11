import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { PlatformSettingsService } from '../services/platform-settings.service';

@Controller(['super-admin/settings', 'super_admin/settings'])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get()
  async getSettings() {
    const data = await this.settingsService.getPlatformSettings();
    return {
      success: true,
      data,
    };
  }

  @Post()
  async updateSettings(@Req() req: any, @Body() body: any) {
    const data = await this.settingsService.updatePlatformSettings(
      body,
      req.user.id,
    );
    return {
      success: true,
      data,
    };
  }
}
