import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../common/utils/rate-limit.util';
import { AalGuard } from '../../auth/aal.guard';
import * as z from 'zod';

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  priority: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
  permissions: z.array(z.string()).default([]),
});

const roleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  priority: z.number().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

const statusToggleSchema = z.object({
  isActive: z.boolean(),
});

const reassignDeleteSchema = z.object({
  replacementRoleId: z.string().min(1, 'Replacement role ID is required'),
});

import { AuthorizationService } from '../../auth/authorization/authorization.service';

const transferOwnerSchema = z.object({
  newOwnerUserId: z.string().min(1, 'New owner user ID is required'),
});

@Controller('crm/roles')
@UseGuards(SupabaseAuthGuard, TenantGuard, PermissionsGuard, AalGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly authService: AuthorizationService,
  ) {}

  @Get()
  @Permissions('Roles')
  async getRoles(@Req() req: any) {
    const data = await this.rolesService.getRoles(req.tenantId);
    return { success: true, data };
  }

  @Get(':id')
  @Permissions('Roles')
  async getRoleById(@Req() req: any, @Param('id') id: string) {
    const data = await this.rolesService.getRoleById(req.tenantId, id);
    return { success: true, data };
  }

  @Post()
  @Permissions('Roles')
  async createRole(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const identifier = `admin_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.ADMIN);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.ADMIN);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to create roles' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const parsedData = roleSchema.parse(body);
      const userAgent = req.headers['user-agent'] || '';
      const data = await this.rolesService.createRole(
        req.tenantId,
        req.user.id,
        currentUserRole,
        parsedData,
        ip,
        userAgent,
      );
      return { success: true, data, message: 'Role created successfully' };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { success: false, message: (error as any).errors[0].message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Put(':id')
  @Permissions('Roles')
  async updateRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const ip = getClientIp(req);
    const identifier = `admin_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.ADMIN);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.ADMIN);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to edit roles' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const parsedData = roleUpdateSchema.parse(body);
      const userAgent = req.headers['user-agent'] || '';
      const data = await this.rolesService.updateRole(
        req.tenantId,
        req.user.id,
        id,
        currentUserRole,
        parsedData,
        ip,
        userAgent,
      );
      return { success: true, message: 'Role updated successfully', data };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { success: false, message: (error as any).errors[0].message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @Permissions('Roles')
  async toggleRoleStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const ip = getClientIp(req);
    const identifier = `admin_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.ADMIN);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.ADMIN);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to change role status' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const parsed = statusToggleSchema.parse(body);
      const userAgent = req.headers['user-agent'] || '';
      const data = await this.rolesService.toggleRoleStatus(
        req.tenantId,
        req.user.id,
        id,
        parsed.isActive,
        ip,
        userAgent,
      );
      return {
        success: true,
        data,
        message: `Role ${parsed.isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { success: false, message: (error as any).errors[0].message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @Permissions('Roles')
  async deleteRole(
    @Req() req: any,
    @Param('id') id: string,
    @Query('replacementRoleId') replacementQuery?: string,
    @Body() body?: any,
  ) {
    const ip = getClientIp(req);
    const identifier = `delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.DELETE);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.DELETE);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to delete roles' },
        HttpStatus.FORBIDDEN,
      );
    }

    const replacementRoleId = replacementQuery || body?.replacementRoleId;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.rolesService.deleteRole(
      req.tenantId,
      req.user.id,
      id,
      replacementRoleId,
      ip,
      userAgent,
    );
    return result;
  }

  @Post(':id/reassign-and-delete')
  @Permissions('Roles')
  async reassignAndDeleteRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const ip = getClientIp(req);
    const identifier = `delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.DELETE);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.DELETE);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to delete roles' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const parsed = reassignDeleteSchema.parse(body);
      const userAgent = req.headers['user-agent'] || '';
      const result = await this.rolesService.deleteRole(
        req.tenantId,
        req.user.id,
        id,
        parsed.replacementRoleId,
        ip,
        userAgent,
      );
      return result;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { success: false, message: (error as any).errors[0].message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Post(':id/duplicate')
  @Permissions('Roles')
  async duplicateRole(@Req() req: any, @Param('id') id: string) {
    const ip = getClientIp(req);
    const identifier = `admin_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.ADMIN);
    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.ADMIN);

    const currentUserRole = req.userRole?.name?.toUpperCase() || 'UNKNOWN';
    if (currentUserRole === 'EMPLOYEE') {
      throw new HttpException(
        { success: false, message: 'Unauthorized to duplicate roles' },
        HttpStatus.FORBIDDEN,
      );
    }

    const userAgent = req.headers['user-agent'] || '';
    const data = await this.rolesService.duplicateRole(
      req.tenantId,
      req.user.id,
      id,
      ip,
      userAgent,
    );
    return { success: true, message: 'Role duplicated successfully', data };
  }

  @Post('transfer-owner')
  async transferOwnership(@Req() req: any, @Body() body: any) {
    if (!req.isSuperAdmin && !req.isOrgOwner) {
      throw new HttpException(
        {
          success: false,
          message:
            'Access denied: Only the active Organization Owner can transfer ownership.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const parsed = transferOwnerSchema.parse(body);
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const result = await this.authService.transferOrganizationOwnership(
        req.tenantId,
        req.user.id || req.user.sub,
        parsed.newOwnerUserId,
        {
          actorUserId: req.user.id || req.user.sub,
          ipAddress: ip,
          userAgent,
        },
      );
      return {
        success: true,
        message: 'Organization ownership transferred successfully.',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { success: false, message: (error as any).errors[0].message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }
}
