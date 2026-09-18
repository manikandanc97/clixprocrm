import { tool } from 'ai';
import { z } from 'zod';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';

/**
 * @file ai/tools/leads.tools.ts
 * AI tool implementations for Leads.
 *
 * ENCRYPTION: Lead.name, email, phone, company are decrypted before returning to AI.
 */
export function buildLeadsTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
  enc: EncryptionService,
) {
  return {
    getLeads: tool({
      description:
        'Get a list of leads visible to the user. Optionally filter by priority, stage, or converted status.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe('Maximum number of leads to return. Default is 5, max 50.'),
        priority: z
          .string()
          .optional()
          .describe('Lead priority to filter by (e.g. HIGH, MEDIUM, LOW)'),
        stage: z
          .string()
          .optional()
          .describe(
            'Lead stage to filter by (e.g. NEW, CONTACTED, PROPOSAL_SENT, WON, LOST)',
          ),
        isConverted: z
          .boolean()
          .optional()
          .describe('Filter by converted status'),
      }),
      execute: async (args: {
        limit?: number;
        priority?: string;
        stage?: string;
        isConverted?: boolean;
      }) => {
        const toolName = 'getLeads';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.LEADS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Leads permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Leads.',
          };
        }

        try {
          const { limit = 5, priority, stage, isConverted } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getLeadsVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (priority) whereClause.priority = priority;
          if (stage) whereClause.stage = stage;
          if (isConverted !== undefined) whereClause.isConverted = isConverted;

          const leads = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.lead.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: safeLimit,
                select: {
                  id: true,
                  name: true,
                  company: true,
                  email: true,
                  phone: true,
                  value: true,
                  priority: true,
                  stage: true,
                  isConverted: true,
                  createdAt: true,
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: leads.length },
          );

          // Decrypt PII before passing to AI model
          return leads.map((l) => ({
            id: l.id,
            name: enc.decrypt(l.name),
            company: enc.decrypt(l.company),
            email: enc.decrypt(l.email),
            phone: enc.decrypt(l.phone),
            value: l.value ? Number(l.value) : 0,
            priority: l.priority,
            stage: l.stage,
            isConverted: l.isConverted,
            createdAt: l.createdAt.toISOString(),
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch leads.', details: e.message };
        }
      },
    } as any),
  };
}
