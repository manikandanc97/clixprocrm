import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import {
  PlatformModulesService,
  CreatePlatformModuleDto,
  UpdatePlatformModuleDto,
  NavigationScope,
} from '../services/platform-modules.service';

@Controller(['super-admin/modules', 'super_admin/modules'])
export class PlatformModulesController {
  constructor(private readonly modulesService: PlatformModulesService) {}

  /**
   * Dynamic TENANT CRM navigation menu endpoint.
   * Returns only TENANT_CRM scope items — safe for authenticated tenant users.
   * Used by: usePlatformNavigation() hook → tenant workspace sidebar.
   */
  @Get('navigation')
  @UseGuards(SupabaseAuthGuard)
  async getNavigation(@Req() req: any) {
    const user = req.user;
    const modules = await this.modulesService.getNavigationMenu({
      isSuperAdmin: user?.isSuperAdmin === true,
      role: user?.role,
      permissions: user?.permissions,
    });
    return {
      success: true,
      data: modules,
    };
  }

  /**
   * Dynamic SUPER ADMIN navigation menu endpoint.
   * Returns only SUPER_ADMIN scope items — for the platform admin sidebar.
   * Requires SuperAdminGuard since this exposes admin nav structure.
   * Used by: useSuperAdminNavigation() hook → super admin sidebar.
   */
  @Get('super-admin-navigation')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async getSuperAdminNavigation() {
    const modules = await this.modulesService.getSuperAdminNavigationMenu();
    return {
      success: true,
      data: modules,
    };
  }

  /**
   * Super Admin full module management endpoints.
   * Strictly guarded by SuperAdminGuard.
   */
  @Get()
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async listModules(
    @Query('search') search?: string,
    @Query('group') group?: string,
    @Query('navigationScope') navigationScope?: string,
    @Query('isEnabled') isEnabled?: string,
    @Query('isVisible') isVisible?: string,
  ) {
    const data = await this.modulesService.listModules({
      search,
      group,
      navigationScope: navigationScope || 'TENANT_CRM',
      isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
      isVisible: isVisible !== undefined ? isVisible === 'true' : undefined,
    });
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async getModule(@Param('id') id: string) {
    const data = await this.modulesService.getModuleById(id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async createModule(@Req() req: any, @Body() body: CreatePlatformModuleDto) {
    if (!body.label || !body.route) {
      throw new HttpException(
        { success: false, message: 'Module label and route are required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.modulesService.createModule(body, req.user.id);
    return {
      success: true,
      data,
      message: 'Platform module created successfully',
    };
  }

  @Patch('reorder')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async reorderModules(
    @Req() req: any,
    @Body() body: { items: Array<{ id: string; sortOrder: number }> },
  ) {
    const result = await this.modulesService.reorderModules(body.items, req.user.id);
    return result;
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async updateModule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePlatformModuleDto,
  ) {
    const data = await this.modulesService.updateModule(id, body, req.user.id);
    return {
      success: true,
      data,
      message: 'Platform module updated successfully',
    };
  }

  @Patch(':id/toggle')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async toggleStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { isEnabled?: boolean; isVisible?: boolean },
  ) {
    const data = await this.modulesService.toggleModuleStatus(id, body, req.user.id);
    return {
      success: true,
      data,
      message: 'Module status updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  async deleteModule(@Req() req: any, @Param('id') id: string) {
    const result = await this.modulesService.deleteModule(id, req.user.id);
    return result;
  }
}
