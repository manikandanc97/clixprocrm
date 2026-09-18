import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import {
    checkRateLimit,
    getClientIp,
    incrementRateLimit,
    RATE_LIMITS,
} from '../../common/utils/rate-limit.util';
import { DepartmentsService } from '../services/departments.service';

@Controller('crm/departments')
@UseGuards(SupabaseAuthGuard, TenantGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('Employees:View')
  async getDepartments(@Req() req: any) {
    const data = await this.departmentsService.getDepartments(req.tenantId);
    return { success: true, data };
  }

  @Post()
  @Permissions('Employees:Manage')
  async createDepartment(@Req() req: any, @Body() body: any) {
    const { name, description } = body;
    if (!name) {
      throw new HttpException(
        { success: false, message: 'Name is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const data = await this.departmentsService.createDepartment(
        req.tenantId,
        req.user.sub,
        name,
        description,
      );
      return {
        success: true,
        data,
        message: 'Department created successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @Permissions('Employees:Manage')
  async updateDepartment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { name, description } = body;
    try {
      const data = await this.departmentsService.updateDepartment(
        req.tenantId,
        id,
        req.user.sub,
        name,
        description,
      );
      return {
        success: true,
        message: 'Department updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Permissions('Employees:Manage')
  async deleteDepartment(@Req() req: any, @Param('id') id: string) {
    const ip = getClientIp(req);
    const identifier = `delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.DELETE);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res?.setHeader('Retry-After', retryAfterSeconds.toString());
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

    try {
      await this.departmentsService.deleteDepartment(
        req.tenantId,
        id,
        req.user.sub,
      );
      return { success: true, message: 'Department deleted successfully' };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
