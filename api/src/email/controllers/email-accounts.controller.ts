import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmailAccountsService } from '../services/email-accounts.service';
import { CreateEmailAccountDto } from '../dto/create-email-account.dto';
import { UpdateEmailAccountDto } from '../dto/update-email-account.dto';
import { VerifyEmailAccountDto } from '../dto/verify-email-account.dto';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

export function isUserTenantAdmin(req: any): boolean {
  if (req.isSuperAdmin || req.isOrgOwner) return true;
  const roleName = (req.userRole?.name || '').toUpperCase().trim().replace(/[\s_]+/g, '');
  return roleName === 'ADMIN' || roleName === 'SUPERADMIN' || roleName === 'OWNER';
}

@Controller(['crm/email-accounts', 'crm/email/accounts'])
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class EmailAccountsController {
  constructor(private readonly emailAccountsService: EmailAccountsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getAccounts(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.getAccounts(
      req.tenantId,
      userId,
      isTenantAdmin,
    );
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createAccount(@Req() req: any, @Body() body: CreateEmailAccountDto) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.createAccount(
      req.tenantId,
      userId,
      isTenantAdmin,
      body,
    );
    return { success: true, data };
  }

  @Post('verify')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async verifyDirect(@Body() body: VerifyEmailAccountDto) {
    const data = await this.emailAccountsService.verifyDirect(body);
    return { success: data.success, data };
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getAccountById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.getAccountById(
      req.tenantId,
      userId,
      isTenantAdmin,
      id,
    );
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateEmailAccountDto,
  ) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.updateAccount(
      req.tenantId,
      userId,
      isTenantAdmin,
      id,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async deleteAccount(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.deleteAccount(
      req.tenantId,
      userId,
      isTenantAdmin,
      id,
    );
    return { success: true, data };
  }

  @Post(':id/verify')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async verifyAccount(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    const isTenantAdmin = isUserTenantAdmin(req);
    const data = await this.emailAccountsService.verifyAccount(
      req.tenantId,
      userId,
      isTenantAdmin,
      id,
    );
    return { success: data.success, data };
  }
}
