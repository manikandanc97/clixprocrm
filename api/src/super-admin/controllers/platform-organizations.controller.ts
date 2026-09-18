import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';
import { PlatformOrganizationsService } from '../services/platform-organizations.service';

@Controller(['super-admin/organizations', 'super_admin/organizations'])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformOrganizationsController {
  constructor(private readonly orgsService: PlatformOrganizationsService) {}

  @Get()
  async listOrganizations(
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'SUSPENDED',
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { page: p, limit: l } = parsePaginationParams({ page, limit }, 20);
    const data = await this.orgsService.listOrganizations({
      search,
      status,
      plan,
      page: p,
      limit: l,
    });
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    const data = await this.orgsService.getOrganizationDetails(id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  async createOrganization(@Req() req: any, @Body() body: any) {
    if (!body.name) {
      throw new HttpException(
        { success: false, message: 'Organization name is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.orgsService.createOrganization(body, req.user.id);
    return {
      success: true,
      data,
      message: 'Organization created successfully',
    };
  }

  @Put(':id')
  async updateOrganization(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.orgsService.updateOrganization(
      id,
      body,
      req.user.id,
    );
    return {
      success: true,
      data,
      message: 'Organization updated successfully',
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED'; reason?: string },
  ) {
    if (!body.status || !['ACTIVE', 'SUSPENDED'].includes(body.status)) {
      throw new HttpException(
        {
          success: false,
          message: 'Valid status (ACTIVE or SUSPENDED) is required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.orgsService.updateStatus(
      id,
      body.status,
      req.user.id,
      body.reason,
    );
    return {
      success: true,
      data,
      message: `Organization ${body.status.toLowerCase()} successfully`,
    };
  }

  @Delete(':id')
  async deleteOrganization(@Req() req: any, @Param('id') id: string) {
    const data = await this.orgsService.deleteOrganization(id, req.user.id);
    return {
      success: true,
      data,
      message: 'Organization deleted successfully',
    };
  }
}
