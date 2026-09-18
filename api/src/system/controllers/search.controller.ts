import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import {
    checkRateLimit,
    getClientIp,
    incrementRateLimit,
    RATE_LIMITS,
} from '../../common/utils/rate-limit.util';
import { SearchService } from '../services/search.service';

@Controller('crm/search')
@UseGuards(SupabaseAuthGuard, TenantGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(@Req() req: any, @Query('q') q: string) {
    const ip = getClientIp(req);
    const identifier = `search_${ip}`;
    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.SEARCH || { maxRequests: 100, windowMs: 60000 },
    );
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res?.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(
      identifier,
      RATE_LIMITS.SEARCH || { maxRequests: 100, windowMs: 60000 },
    );

    const isEmployee = req.userRole?.name?.toUpperCase() === 'EMPLOYEE';
    const data = await this.searchService.globalSearch(
      req.tenantId,
      req.user.id,
      isEmployee,
      q?.trim() || '',
    );
    return { success: true, data };
  }
}
