import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  streamText,
  generateText,
  convertToModelMessages,
  isStepCount,
} from 'ai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from './ai-security.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { buildDealsTools } from './tools/deals.tools';
import { buildLeadsTools } from './tools/leads.tools';
import { buildCustomersTools } from './tools/customers.tools';
import { buildTasksTools } from './tools/tasks.tools';
import { buildQuotationsTools } from './tools/quotations.tools';
import { buildPlatformTools } from './tools/platform.tools';

/**
 * @file ai/ai.service.ts
 * AI orchestration service. Responsible for:
 *  - Initializing the Google AI client
 *  - Composing authorized tools from domain tool builders
 *  - Generating streaming and non-streaming AI responses
 *
 * All tool implementations live in ai/tools/*.tools.ts.
 * Security enforcement is delegated to AiSecurityService.
 */
@Injectable()
export class AiService {
  private googleAi: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly aiSecurityService: AiSecurityService,
    private readonly enc: EncryptionService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.googleAi = createGoogleGenerativeAI({ apiKey });
    }
  }

  /**
   * Generates system prompt enforcing security constraints and current tenant context.
   */
  private getSystemPrompt(userContext: UserSecurityContext): string {
    const today = new Date().toISOString().split('T')[0];
    const isSuperAdmin =
      userContext.roleName === 'SUPER_ADMIN' ||
      userContext.roleName.replace(/[\s_]+/g, '') === 'SUPERADMIN' ||
      userContext.isSystemAdmin;

    if (isSuperAdmin) {
      return `You are ClixPro AI (Platform Agent) for ClixProCRM Superadmin Platform (User ID: ${userContext.userId}, Role: SUPER_ADMIN).
Current Date: ${today}. Default Currency: INR (₹).

ROLE & CAPABILITIES:
You are the executive platform AI assistant for ClixProCRM Super-Administrators. You have access to platform tools to inspect organizations/tenants, platform analytics/MRR, security audit logs, platform users, and subscription tiers.

RESPONSE & TOKEN RULES:
1. Answer ONLY the user's exact question. Keep responses ultra-concise, direct, and token-efficient.
2. No conversational filler, no greetings (except when user greets), and do not repeat the user's question.
3. For simple questions, answer in 1-3 short sentences. For data queries, return only the requested data cleanly formatted.
4. If information is not found, say: "I couldn't find that platform information." Never hallucinate data.
5. Bound strictly by Superadmin platform oversight and tool responses.
6. Never expose internal API keys, JWT secrets, database connection strings, passwords, or credentials.`;
    }

    return `You are ClixPro AI for ClixProCRM (User ID: ${userContext.userId}, Role: ${userContext.roleName}).
Current Date: ${today}. Default Currency: INR (₹).

RESPONSE & TOKEN RULES:
1. Answer ONLY the user's exact question. Keep responses ultra-concise, direct, and token-efficient.
2. No conversational filler, no greetings (except when user greets), and do not repeat the user's question.
3. For simple questions, answer in 1-3 short sentences. For data queries, return only the requested data.
4. If information is not found in the CRM, say: "I couldn't find that information." Never hallucinate data.
5. Bound strictly by role (${userContext.roleName}) and tool responses.
6. Never expose internal API keys, JWT secrets, database connection strings, passwords, or credentials.`;
  }

  /**
   * Composes all authorized tools for the user from domain-specific tool builders.
   * Each builder enforces its own permission checks via AiSecurityService.
   */
  public getAuthorizedTools(userContext: UserSecurityContext): Record<string, any> {
    const isSuperAdmin =
      userContext.roleName === 'SUPER_ADMIN' ||
      userContext.roleName.replace(/[\s_]+/g, '') === 'SUPERADMIN' ||
      userContext.isSystemAdmin;

    return {
      ...(isSuperAdmin ? buildPlatformTools(this.prisma, this.aiSecurityService, userContext) : {}),
      ...buildDealsTools(this.prisma, this.aiSecurityService, userContext),
      ...buildLeadsTools(this.prisma, this.aiSecurityService, userContext, this.enc),
      ...buildCustomersTools(this.prisma, this.aiSecurityService, userContext, this.enc),
      ...buildTasksTools(this.prisma, this.aiSecurityService, userContext),
      ...buildQuotationsTools(this.prisma, this.aiSecurityService, userContext, this.enc),
    };
  }

  /**
   * Resolves model names and maps legacy/deprecated names to current active Google Gemini models.
   */
  public resolveModelName(modelName?: string): string {
    const legacyMap: Record<string, string> = {
      'gemini-1.5-flash': 'gemini-3.6-flash',
      'gemini-1.5-flash-latest': 'gemini-3.6-flash',
      'gemini-2.0-flash': 'gemini-3.6-flash',
      'gemini-2.5-flash': 'gemini-3.6-flash',
      'gemini-1.5-pro': 'gemini-3.6-flash',
      'gemini-2.5-pro': 'gemini-3.6-flash',
    };
    if (!modelName) return 'gemini-3.6-flash';
    return legacyMap[modelName] || modelName;
  }

  /**
   * Sanitizes and ensures message structure is compliant with UIMessage specification.
   */
  private sanitizeMessages(messages: any[]): any[] {
    return (messages || []).map((m) => {
      if (typeof m === 'string') {
        return { role: 'user', parts: [{ type: 'text', text: m }] };
      }
      if (m.parts && Array.isArray(m.parts) && m.parts.length > 0) {
        return m;
      }
      if (typeof m.content === 'string') {
        return { ...m, role: m.role || 'user', parts: [{ type: 'text', text: m.content }] };
      }
      if (Array.isArray(m.content)) {
        return { ...m, role: m.role || 'user', parts: m.content };
      }
      return { ...m, role: m.role || 'user', parts: [{ type: 'text', text: '' }] };
    });
  }

  /**
   * Resolves the AI client for the given tenant (using tenant's encrypted BYOK key if present,
   * or falling back to platform GEMINI_API_KEY).
   */
  private async getAiClientForTenant(tenantId?: string) {
    if (tenantId) {
      const config = await this.prisma.withTenantContext(
        { tenantId },
        async (tx) => {
          return tx.tenantAiConfig.findUnique({
            where: { tenantId },
          });
        },
      );
      if (config) {
        if (config.isAiEnabled === false) {
          throw new InternalServerErrorException('AI assistant is currently disabled for this workspace.');
        }
        if (config.apiKey) {
          const decryptedKey = this.enc.decrypt(config.apiKey);
          if (decryptedKey) {
            return createGoogleGenerativeAI({ apiKey: decryptedKey });
          }
        }
      }
    }
    if (!this.googleAi) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured on the backend',
      );
    }
    return this.googleAi;
  }

  async generateStream(
    messages: any[],
    modelName = 'gemini-2.5-flash',
    userContext: UserSecurityContext,
    provider = 'google',
  ): Promise<any> {
    const aiClient = await this.getAiClientForTenant(userContext.tenantId);
    const activeModel = this.resolveModelName(modelName);

    try {
      const tools = this.getAuthorizedTools(userContext);
      const sanitizedMessages = this.sanitizeMessages(messages);
      const coreMessages = await convertToModelMessages(sanitizedMessages, { tools });

      const result = await streamText({
        model: aiClient(activeModel),
        messages: coreMessages,
        temperature: 0.7,
        stopWhen: isStepCount(5),
        system: this.getSystemPrompt(userContext),
        tools,
      });

      return result;
    } catch (error: any) {
      console.error('[AI CHAT ERROR] generateStream failed:', error);
      return {
        pipeUIMessageStreamToResponse: async (res: any) => {
          if (res.statusCode === 200) {
            res.statusCode = 500;
          }
          res.end(
            JSON.stringify({ error: error?.message || error.toString() }),
          );
        },
      };
    }
  }

  async generateText(
    messages: any[],
    modelName = 'gemini-2.5-flash',
    userContext: UserSecurityContext,
    provider = 'google',
  ): Promise<string> {
    const aiClient = await this.getAiClientForTenant(userContext.tenantId);
    const activeModel = this.resolveModelName(modelName);

    try {
      const tools = this.getAuthorizedTools(userContext);
      const sanitizedMessages = this.sanitizeMessages(messages);
      const coreMessages = await convertToModelMessages(sanitizedMessages, { tools });

      const result = await generateText({
        model: aiClient(activeModel),
        messages: coreMessages,
        temperature: 0.7,
        stopWhen: isStepCount(5),
        system: this.getSystemPrompt(userContext),
        tools,
      });

      return result.text;
    } catch (error: any) {
      console.error('[AI CHAT ERROR] generateText failed:', error);
      throw new InternalServerErrorException(
        'Failed to generate AI text',
        error?.toString(),
      );
    }
  }
}

