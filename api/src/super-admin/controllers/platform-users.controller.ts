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
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';
import { PlatformUsersService } from '../services/platform-users.service';

@Controller(['super-admin/users', 'super_admin/users'])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformUsersController {
  constructor(private readonly usersService: PlatformUsersService) {}

  @Get()
  async listUsers(
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('isSuperAdmin') isSuperAdmin?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { page: p, limit: l } = parsePaginationParams({ page, limit }, 20);
    const data = await this.usersService.listUsers({
      search,
      status,
      isSuperAdmin:
        isSuperAdmin === 'true'
          ? true
          : isSuperAdmin === 'false'
            ? false
            : undefined,
      page: p,
      limit: l,
    });
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getUserDetails(@Param('id') id: string) {
    const data = await this.usersService.getUserDetails(id);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: UserStatus },
  ) {
    if (
      !body.status ||
      !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(body.status)
    ) {
      throw new HttpException(
        {
          success: false,
          message: 'Valid status (ACTIVE, INACTIVE, SUSPENDED) is required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.usersService.updateUserStatus(
      id,
      body.status,
      req.user.id,
    );
    return {
      success: true,
      data,
      message: 'User status updated successfully',
    };
  }

  @Post('transfer-super-admin')
  async transferSuperAdmin(
    @Req() req: any,
    @Body() body: { targetUserId: string },
  ) {
    if (!body.targetUserId || typeof body.targetUserId !== 'string') {
      throw new HttpException(
        { success: false, message: 'targetUserId is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.usersService.transferSuperAdmin(
      body.targetUserId,
      req.user.id,
      {
        ip: req.ip || req.headers?.['x-forwarded-for'],
        userAgent: req.headers?.['user-agent'],
      },
    );

    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Patch(':id/super-admin')
  async toggleSuperAdmin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { isSuperAdmin: boolean },
  ) {
    if (typeof body.isSuperAdmin !== 'boolean') {
      throw new HttpException(
        { success: false, message: 'isSuperAdmin boolean is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.usersService.toggleSuperAdmin(
      id,
      body.isSuperAdmin,
      req.user.id,
      {
        ip: req.ip || req.headers?.['x-forwarded-for'],
        userAgent: req.headers?.['user-agent'],
      },
    );
    return {
      success: true,
      data,
      message: `Super Admin ownership transferred successfully`,
    };
  }

  @Delete(':id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const data = await this.usersService.deleteUser(id, req.user.id, {
      ip: req.ip || req.headers?.['x-forwarded-for'],
      userAgent: req.headers?.['user-agent'],
    });
    return {
      success: true,
      data,
      message: data.message || 'User deleted successfully',
    };
  }
}
