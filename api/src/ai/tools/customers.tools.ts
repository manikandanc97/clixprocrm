import { tool } from 'ai';
import { z } from 'zod';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';

/**
 * @file ai/tools/customers.tools.ts
 * AI tool implementations for Customers.
 *
 * ENCRYPTION: Customer.name, email, company are decrypted before returning to AI.
 * Search is applied post-decryption since fields are encrypted in DB.
 */
export function buildCustomersTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
  enc: EncryptionService,
) {
  return {
    getCustomers: tool({
      description:
        'Get a list of customers visible to the user. Optionally filter by status.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe(
            'Maximum number of customers to return. Default is 5, max 50.',
          ),
        status: z
          .string()
          .optional()
          .describe(
            'Customer status to filter by (e.g. ACTIVE, PREMIUM, INACTIVE)',
          ),
        search: z
          .string()
          .optional()
          .describe('Search query for customer or company name'),
      }),
      execute: async (args: {
        limit?: number;
        status?: string;
        search?: string;
      }) => {
        const toolName = 'getCustomers';
        const hasContactsPerm = aiSecurityService.hasModulePermission(
          userContext,
          PERMISSION_MODULES.CONTACTS,
        );
        const hasCompaniesPerm = aiSecurityService.hasModulePermission(
          userContext,
          PERMISSION_MODULES.COMPANIES,
        );
        const hasDashboardPerm = aiSecurityService.hasModulePermission(
          userContext,
          PERMISSION_MODULES.DASHBOARD,
        );

        if (!hasContactsPerm && !hasCompaniesPerm && !hasDashboardPerm) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Contacts/Companies/Dashboard permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Customers.',
          };
        }

        try {
          const { limit = 5, status, search } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getCustomersVisibilityFilter(userContext);

          // Note: search on encrypted fields must be done post-decryption
          const whereClause: any = { ...visibilityFilter };
          if (status) whereClause.status = status;

          const customers = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.customer.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                // Fetch more when search is active so we can filter post-decryption
                take: search ? Math.min(safeLimit * 10, 200) : safeLimit,
                select: {
                  id: true,
                  name: true,
                  company: true,
                  email: true,
                  status: true,
                  revenue: true,
                  createdAt: true,
                },
              }),
          );

          // Decrypt PII
          const decrypted = customers.map((c) => ({
            id: c.id,
            name: enc.decrypt(c.name),
            company: enc.decrypt(c.company),
            email: enc.decrypt(c.email),
            status: c.status,
            revenue: c.revenue ? Number(c.revenue) : 0,
            createdAt: c.createdAt.toISOString(),
          }));

          // Post-decryption search filter
          const filtered = search
            ? decrypted
                .filter(
                  (c) =>
                    (c.name || '')
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    (c.company || '')
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .slice(0, safeLimit)
            : decrypted;

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: filtered.length },
          );

          return filtered;
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch customers.', details: e.message };
        }
      },
    } as any),
  };
}
