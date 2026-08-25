import { Controller, Get, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AiService } from './ai.service';
import { AiSecurityService } from './ai-security.service';
import { AiEntitlementService } from './ai-entitlement.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';

@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiSecurityService: AiSecurityService,
    private readonly aiEntitlementService: AiEntitlementService,
  ) {}

  /**
   * Returns ONLY the AI models and capabilities entitled for the current user's workspace plan.
   */
  @Get('models')
  async getEntitledModels(@Req() req: any) {
    const isSuperAdmin = req.isSuperAdmin || false;
    const tenantId = isSuperAdmin ? undefined : req.tenantId;
    const entitlements = await this.aiEntitlementService.getEffectiveEntitlements(tenantId);
    return {
      success: true,
      data: entitlements,
    };
  }

  @Post('chat')
  async chat(@Body() body: any, @Res() res: FastifyReply, @Req() req: any) {
    const startMs = Date.now();
    const tenantId = req.tenantId;
    const userId = req.user?.id || req.user?.sub;
    const userRole = req.userRole;
    const isSuperAdmin = req.isSuperAdmin || false;
    const requestedModel = body.model;
    const capability = body.capability || 'chat';

    try {
      const messages = body.messages || [];

      // 1. Authoritative Backend Model Entitlement Validation
      const validatedModel = await this.aiEntitlementService.validateModelAccess(
        isSuperAdmin ? undefined : tenantId,
        requestedModel,
        capability,
      );

      const activeModelKey = validatedModel.modelKey;
      const provider = validatedModel.provider || 'google';

      // 2. Build full RBAC and hierarchy security context
      const securityContext =
        await this.aiSecurityService.buildSecurityContext(
          userId,
          tenantId,
          userRole,
          isSuperAdmin,
        );

      const streamResult = await this.aiService.generateStream(
        messages,
        activeModelKey,
        securityContext,
        provider,
      );

      // Record successful AI usage
      const latencyMs = Date.now() - startMs;
      await this.aiEntitlementService.recordUsage({
        tenantId: tenantId || 'platform',
        userId: userId || 'anonymous',
        modelKey: activeModelKey,
        provider,
        capability,
        latencyMs,
        status: 'SUCCESS',
      });

      // Pipe UI message stream to response (CORS is handled globally by NestJS middleware)
      const pipePromise = streamResult.pipeUIMessageStreamToResponse(res.raw);
      if (pipePromise && pipePromise.catch) {
        pipePromise.catch((error: any) => {
          console.error('[AI CHAT ERROR] Error during streaming:', error);
          if (error.stack) console.error('[AI CHAT ERROR] Stack:', error.stack);
        });
      }
    } catch (e: any) {
      const latencyMs = Date.now() - startMs;
      await this.aiEntitlementService.recordUsage({
        tenantId: tenantId || 'platform',
        userId: userId || 'anonymous',
        modelKey: requestedModel || 'unknown',
        capability,
        latencyMs,
        status: 'FAILED',
        errorMessage: e.message || String(e),
      });

      console.error('[AI CHAT ERROR] Controller exception:', e.message || e);
      let status = e.status || (e.name === 'ForbiddenException' ? 403 : e.name === 'ServiceUnavailableException' ? 503 : 500);
      let code = 'AI_PROVIDER_ERROR';

      if (e.message?.includes('AI_SERVICES_UNAVAILABLE')) {
        code = 'AI_SERVICES_UNAVAILABLE';
        status = 503;
      } else if (e.message?.includes('AI_NOT_ENABLED_FOR_PLAN')) {
        code = 'AI_NOT_ENABLED_FOR_PLAN';
        status = 403;
      } else if (e.message?.includes('AI_MODEL_NOT_ENTITLED')) {
        code = 'AI_MODEL_NOT_ENTITLED';
        status = 403;
      } else if (e.message?.includes('AI_USAGE_LIMIT_EXCEEDED')) {
        code = 'AI_USAGE_LIMIT_EXCEEDED';
        status = 429;
      }

      res.status(status).send({
        error: e.message || 'AI request failed.',
        code,
      });
    }
  }
}


