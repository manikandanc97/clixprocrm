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
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
    checkRateLimit,
    getClientIp,
    incrementRateLimit,
    RATE_LIMITS,
} from '../common/utils/rate-limit.util';
import { BulkDealDto } from './dto/bulk-deal.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsService } from './services/deals.service';

@Controller('crm/deals')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getDeals(@Req() req: any, @Query() query: PaginationQueryDto) {
    const data = await this.dealsService.getDeals(
      req.tenantId,
      query.page,
      query.limit,
      query.search,
    );
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createDeal(@Req() req: any, @Body() body: CreateDealDto) {
    const data = await this.dealsService.createDeal(
      req.tenantId,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async getDealById(@Req() req: any, @Param('id') id: string) {
    const data = await this.dealsService.getDealById(req.tenantId, id);
    if (!data)
      throw new HttpException(
        { success: false, message: 'Deal not found' },
        HttpStatus.NOT_FOUND,
      );
    return { success: true, data };
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateDeal(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateDealDto,
  ) {
    const data = await this.dealsService.updateDeal(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteDeal(@Req() req: any, @Param('id') id: string) {
    const ip = getClientIp(req);
    const identifier = `delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.DELETE);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res.setHeader('Retry-After', retryAfterSeconds.toString());
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

    await this.dealsService.deleteDeal(req.tenantId, id);
    return { success: true, message: 'Deal deleted successfully' };
  }

  @Post('bulk')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async bulkDeleteDeals(@Req() req: any, @Body() body: BulkDealDto) {
    const ip = getClientIp(req);
    const identifier = `bulk_delete_deals_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.BULK_DELETE);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res.setHeader('Retry-After', retryAfterSeconds.toString());
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
    await incrementRateLimit(identifier, RATE_LIMITS.BULK_DELETE);

    if (!body.ids || !Array.isArray(body.ids)) {
      throw new HttpException(
        { success: false, message: 'Invalid request. Expected array of ids.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.dealsService.bulkDeleteDeals(req.tenantId, body.ids);
    return { success: true, data: { count: body.ids.length } };
  }
}
