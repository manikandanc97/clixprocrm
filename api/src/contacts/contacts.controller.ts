import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PlanLimitGuard } from '../common/plans/plan-feature.guard';
import { RequirePlanLimit } from '../common/plans/plan-feature.decorator';

@Controller('crm/customers')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getCustomers(@Req() req: any, @Query() query: PaginationQueryDto) {
    const data = await this.contactsService.getCustomers(req.tenantId, query);
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @UseGuards(PlanLimitGuard)
  @RequirePlanLimit('maxContacts')
  async createCustomer(@Req() req: any, @Body() body: CreateContactDto) {
    const data = await this.contactsService.createCustomer(
      req.tenantId,
      body,
      req.user.sub,
    );
    return { success: true, data };
  }
}
