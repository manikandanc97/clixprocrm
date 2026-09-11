import { tool } from 'ai';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';
import { EncryptionService } from '../../common/encryption/encryption.service';

/**
 * @file ai/tools/quotations.tools.ts
 * AI tool implementations for Quotations.
 *
 * ENCRYPTION: Quotation.client is decrypted before returning to AI.
 */
export function buildQuotationsTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
  enc: EncryptionService,
) {
  return {
    getQuotations: tool({
      description:
        'Get a list of quotations visible to the user. Optionally filter by status.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe(
            'Maximum number of quotations to return. Default is 5, max 50.',
          ),
        status: z
          .string()
          .optional()
          .describe(
            'Quotation status to filter by, e.g. PENDING, APPROVED, EXPIRED, DRAFT, SENT, VIEWED.',
          ),
      }),
      execute: async (args: { limit?: number; status?: string }) => {
        const toolName = 'getQuotations';
        const hasQuotationsPerm = aiSecurityService.hasModulePermission(
          userContext,
          PERMISSION_MODULES.QUOTATIONS,
        );
        const hasReportsPerm = aiSecurityService.hasModulePermission(
          userContext,
          PERMISSION_MODULES.REPORTS,
        );

        if (!hasQuotationsPerm && !hasReportsPerm) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Quotations/Reports permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Quotations.',
          };
        }

        try {
          const { limit = 5, status } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getQuotationsVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (status) whereClause.status = status;

          const quotations = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.quotation.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: safeLimit,
                select: {
                  quoteNumber: true,
                  client: true,
                  amount: true,
                  status: true,
                  validTill: true,
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: quotations.length },
          );

          return quotations.map((q) => ({
            quoteNumber: q.quoteNumber,
            client: enc.decrypt(q.client),
            amount: q.amount ? Number(q.amount) : 0,
            status: q.status,
            validTill: q.validTill ? q.validTill.toISOString() : null,
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch quotations.', details: e.message };
        }
      },
    } as any),
  };
}
