import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { parsePaginationParams } from '../common/utils/pagination.util';
import { CustomersService } from './customers.service';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getCustomers(
    @Req() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    const tenantId = req.user.tenantId;
    const { page: pageNum, limit: limitNum } = parsePaginationParams(
      { page, limit },
      10,
    );

    return this.customersService.getCustomers(
      tenantId,
      pageNum,
      limitNum,
      search,
    );
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createCustomer(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.sub;

    return this.customersService.createCustomer(tenantId, userId, body);
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.customersService.updateCustomer(tenantId, id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteCustomer(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.customersService.deleteCustomer(tenantId, id);
  }

  @Post('bulk-delete')
  @Roles('ADMIN', 'MANAGER')
  async bulkDeleteCustomers(@Req() req: any, @Body() body: { ids: string[] }) {
    const tenantId = req.user.tenantId;
    return this.customersService.bulkDeleteCustomers(tenantId, body.ids);
  }
}
