import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase.guard';
import { SessionsService } from './sessions.service';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../common/utils/rate-limit.util';

@Controller('auth/sessions')
@UseGuards(SupabaseAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const ip = getClientIp(req);
    const identifier = `auth:sessions:list:${userId}:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.SESSIONS_LIST,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many session requests. Please wait ${waitSec} seconds before trying again.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.SESSIONS_LIST);

    const currentSessionId = req.sessionId || req.user.sessionId;
    const sessions = await this.sessionsService.listUserSessions(
      userId,
      currentSessionId,
    );

    return {
      success: true,
      data: {
        sessions,
        count: sessions.length,
        activeCount: sessions.filter((s) => !s.isRevoked).length,
      },
    };
  }

  @Delete(':id')
  async revokeSession(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const identifier = `auth:sessions:revoke:${userId}:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.SESSION_REVOKE,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many session revocation attempts. Please wait ${waitSec} seconds before trying again.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.SESSION_REVOKE);

    const currentSessionId = req.sessionId || req.user.sessionId;
    const result = await this.sessionsService.revokeSession(
      userId,
      id,
      currentSessionId,
      typeof ip === 'string' ? ip : undefined,
      userAgent,
    );

    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  @Post('revoke-all-other')
  async revokeAllOtherSessions(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const identifier = `auth:sessions:revoke-all:${userId}:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.SESSION_REVOKE_ALL,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many revoke-all attempts. Please wait ${waitSec} seconds before trying again.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.SESSION_REVOKE_ALL);

    const currentSessionId = req.sessionId || req.user.sessionId;
    const result = await this.sessionsService.revokeAllOtherSessions(
      userId,
      currentSessionId,
      typeof ip === 'string' ? ip : undefined,
      userAgent,
    );

    return {
      success: true,
      data: result,
      message: result.message,
    };
  }
}
