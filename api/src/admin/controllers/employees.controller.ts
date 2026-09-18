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
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import {
    checkRateLimit,
    getClientIp,
    incrementRateLimit,
    RATE_LIMITS,
} from '../../common/utils/rate-limit.util';
import { EmployeesService } from '../services/employees.service';

@Controller('crm/employees')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async getEmployees(
    @Req() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const data = await this.employeesService.getEmployees(
      req.tenantId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
    return {
      success: true,
      data: {
        employees: data.employees,
        stats: data.stats,
        recentActivities: data.activities,
        pagination: data.pagination,
      },
    };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  async inviteEmployee(@Req() req: any, @Body() body: any) {
    const { email, role, name, password } = body;

    if (!email || !role || !name) {
      throw new HttpException(
        { success: false, message: 'Name, email, and role are required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (role === 'ADMIN' && req.userRole !== 'ADMIN') {
      throw new HttpException(
        { success: false, message: 'Only ADMIN can assign the ADMIN role' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const data = await this.employeesService.inviteEmployee(
        req.tenantId,
        email,
        role,
        name,
        password,
      );
      return {
        success: true,
        data,
        message: 'Employee created successfully.',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER')
  async updateEmployee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const actorRole = req.userRole?.name?.toUpperCase();
    const data = await this.employeesService.updateEmployee(
      req.tenantId,
      id,
      actorRole,
      body,
    );
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async patchEmployeeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const actorRole = req.userRole?.name?.toUpperCase();
    const data = await this.employeesService.patchEmployeeStatus(
      req.tenantId,
      id,
      actorRole,
      body.status,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteEmployee(@Req() req: any, @Param('id') id: string) {
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

    const actorRole = req.userRole?.name?.toUpperCase();
    const data = await this.employeesService.deleteEmployee(
      req.tenantId,
      id,
      actorRole,
    );
    return { success: true, data };
  }
}
