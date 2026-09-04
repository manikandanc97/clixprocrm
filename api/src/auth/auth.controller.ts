import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, invalidateGetMeCache } from './auth.service';
import { SessionsService } from './sessions.service';
import { SupabaseAuthGuard, invalidateTokenUserCache, invalidateSessionCache } from './supabase.guard';
import { TenantGuard, invalidateUserTenantCache } from './tenant.guard';
import { AalGuard } from './aal.guard';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../common/utils/rate-limit.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('security/activity')
  async getSecurityActivity(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const ip = getClientIp(req);
    const identifier = `auth:security:activity:${userId}:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.SECURITY_ACTIVITY,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many security activity requests. Please wait ${waitSec} seconds before trying again.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.SECURITY_ACTIVITY);

    const currentSessionId = req.sessionId || req.user?.sessionId;
    const result = await this.sessionsService.getSecurityActivity(
      userId,
      currentSessionId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const result = await this.authService.getMe(
      userId,
      req.tenantId,
      req.user.email,
    );
    return { success: true, data: result };
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    const result = await this.authService.updateMe(userId, body);
    return { success: true, data: result };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('avatar')
  async uploadAvatar(@Req() req: any, @Body() body: any) {
    let fileBuffer: Buffer | null = null;
    let filename = 'avatar.png';

    // 1. Check if sent as base64 in body (JSON)
    if (body?.fileData) {
      const base64Data = body.fileData.includes(';base64,')
        ? body.fileData.split(';base64,')[1]
        : body.fileData;
      fileBuffer = Buffer.from(base64Data, 'base64');
      filename = body.fileName || filename;
    }

    // 2. Check if multipart/form-data
    if (!fileBuffer && typeof req.isMultipart === 'function' && req.isMultipart()) {
      try {
        const file = await req.file();
        if (file) {
          fileBuffer = await file.toBuffer();
          filename = file.filename || filename;
        }
      } catch (err: any) {
        throw new BadRequestException(
          `Failed to read multipart upload: ${err?.message || err}`,
        );
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('No image file was provided');
    }

    const userId = req.user.id || req.user.sub;
    const tenantId = req.tenantId || req.user?.tenantId || 'system';
    const result = await this.authService.uploadAvatar(
      userId,
      fileBuffer,
      filename,
      tenantId,
    );

    return { success: true, data: result };
  }

  @Post('login')
  async loginRateLimit(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const email = (body?.email || '').trim().toLowerCase();
    const identifier = `auth:login:${ip}:${email || 'unknown'}`;

    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.LOGIN);
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many login attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.LOGIN);

    return { success: true, message: 'Login rate limit check passed' };
  }

  @Post('register')
  async registerRateLimit(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const identifier = `auth:register:${ip}`;

    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.REGISTER);
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many registration attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.REGISTER);

    return { success: true, message: 'Register rate limit check passed' };
  }

  @Post('forgot-password')
  async forgotPasswordRateLimit(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const email = (body?.email || '').trim().toLowerCase();
    const identifier = `auth:forgot-password:${ip}:${email || 'unknown'}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.FORGOT_PASSWORD,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many password reset requests. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.FORGOT_PASSWORD);

    return { success: true, message: 'Password reset rate limit check passed' };
  }

  @Post('reset-password')
  async resetPasswordRateLimit(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const identifier = `auth:reset-password:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.RESET_PASSWORD,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many password update attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.RESET_PASSWORD);

    return {
      success: true,
      message: 'Password update rate limit check passed',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const identifier = `auth:change-password:${userId}:${ip}`;

    const rateLimit = await checkRateLimit(
      identifier,
      RATE_LIMITS.CHANGE_PASSWORD,
    );
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many password change attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.CHANGE_PASSWORD);

    const currentSessionId = req.sessionId || req.user?.sessionId;
    const result = await this.authService.handlePasswordChanged(
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

  @UseGuards(SupabaseAuthGuard)
  @Post('password-reset-completed')
  async passwordResetCompleted(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const currentSessionId = req.sessionId || req.user?.sessionId;
    const result = await this.authService.handlePasswordReset(
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

  @UseGuards(SupabaseAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.sub;
    const currentSessionId = req?.sessionId || req?.user?.sessionId;
    const ip = req?.headers ? getClientIp(req) : '127.0.0.1';
    const userAgent = req?.headers ? req.headers['user-agent'] : undefined;

    if (userId) {
      invalidateTokenUserCache(userId);
      invalidateUserTenantCache(userId);
      invalidateGetMeCache(userId);
    }
    if (currentSessionId && userId && this.sessionsService) {
      invalidateSessionCache(currentSessionId, userId);
      await this.sessionsService
        .revokeSessionBySessionId(
          userId,
          currentSessionId,
          typeof ip === 'string' ? ip : undefined,
          userAgent,
        )
        .catch(() => {});
    }
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('onboarding')
  async onboarding(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const userId = req.user.id || req.user.sub;
    const identifier = `auth:onboarding:${ip}:${userId}`;

    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.REGISTER);
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many onboarding attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.REGISTER);

    let companyName = body?.companyName || '';
    let logoFile: { buffer: Buffer; filename?: string } | null = null;

    // 1. Check if multipart/form-data
    if (typeof req.isMultipart === 'function' && req.isMultipart()) {
      try {
        const parts = req.parts();
        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'logo') {
            const buffer = await part.toBuffer();
            if (buffer && buffer.length > 0) {
              logoFile = {
                buffer,
                filename: part.filename || 'logo.png',
              };
            }
          } else if (
            part.type === 'field' &&
            part.fieldname === 'companyName'
          ) {
            companyName = part.value as string;
          }
        }
      } catch (err: any) {
        // Fall back to body if parts fail
      }
    }

    // 2. Check if sent as base64 in JSON body
    if (!logoFile && body?.logoData) {
      const base64Data = body.logoData.includes(';base64,')
        ? body.logoData.split(';base64,')[1]
        : body.logoData;
      logoFile = {
        buffer: Buffer.from(base64Data, 'base64'),
        filename: body.logoFilename || 'logo.png',
      };
    }

    const name =
      req.user.user_metadata?.name ||
      req.user.user_metadata?.full_name ||
      req.user.email?.split('@')[0] ||
      'User';
    const email = req.user.email;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.register(
      { userId, name, email, companyName, logoFile },
      { ip: typeof ip === 'string' ? ip : undefined, userAgent },
    );
    return { success: true, data: result, message: 'Onboarding successful' };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard, AalGuard)
  @Delete('account')
  async deleteAccount(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    const tenantId = req.tenantId;
    const result = await this.authService.deleteAccount(
      userId,
      tenantId,
      body || {},
    );
    return result;
  }
}
