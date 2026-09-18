import { tool } from 'ai';
import { z } from 'zod';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';

/**
 * @file ai/tools/deals.tools.ts
 * AI tool implementations for Deals and Pipeline.
 * Each tool enforces permission checks via AiSecurityService before any DB access.
 */
export function buildDealsTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
) {
  return {
    getDealsSummary: tool({
      description:
        'Get summary statistics of deals and pipeline revenue visible to the user. Can optionally filter by date range.',
      parameters: z.object({
        startDate: z
          .string()
          .optional()
          .describe('ISO date string (YYYY-MM-DD) for start of period'),
        endDate: z
          .string()
          .optional()
          .describe('ISO date string (YYYY-MM-DD) for end of period'),
      }),
      execute: async (args: { startDate?: string; endDate?: string }) => {
        const toolName = 'getDealsSummary';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.DEALS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Deals permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Deals & Revenue.',
          };
        }

        try {
          const { startDate, endDate } = args;
          const visibilityFilter =
            aiSecurityService.getDealsVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt.gte = new Date(startDate);
            if (endDate) whereClause.createdAt.lte = new Date(endDate);
          }

          const deals = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.deal.findMany({
                where: whereClause,
                select: { id: true, value: true, stage: true },
              }),
          );

          const totalDeals = deals.length;
          const wonDeals = deals.filter((d) => d.stage === 'WON');
          const pipelineValue = deals.reduce(
            (sum, d) => sum + Number(d.value || 0),
            0,
          );
          const wonRevenue = wonDeals.reduce(
            (sum, d) => sum + Number(d.value || 0),
            0,
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: totalDeals },
          );

          return {
            totalDeals,
            pipelineValue,
            wonDealsCount: wonDeals.length,
            wonRevenue,
            dealsByStage: deals.reduce((acc: any, d) => {
              acc[d.stage] = (acc[d.stage] || 0) + 1;
              return acc;
            }, {}),
          };
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return {
            error: 'Failed to fetch deals summary.',
            details: e.message,
          };
        }
      },
    } as any),

    getTopDeals: tool({
      description:
        'Get a list of deals visible to the user, sorted by value. Optionally filter by stage or date range.',
      parameters: z.object({
        limit: z
          .number()
          .optional()
          .describe('Maximum number of deals to return. Default is 5, max 50.'),
        stage: z
          .string()
          .optional()
          .describe('Deal stage to filter by, e.g. WON, NEW, PROPOSAL, etc.'),
        startDate: z
          .string()
          .optional()
          .describe('ISO date string for start of period'),
        endDate: z
          .string()
          .optional()
          .describe('ISO date string for end of period'),
      }),
      execute: async (args: {
        limit?: number;
        stage?: string;
        startDate?: string;
        endDate?: string;
      }) => {
        const toolName = 'getTopDeals';
        if (
          !aiSecurityService.hasModulePermission(
            userContext,
            PERMISSION_MODULES.DEALS,
          )
        ) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'DENIED',
            {
              reason: 'Missing Deals permission',
            },
          );
          return {
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view Deals.',
          };
        }

        try {
          const { limit = 5, stage, startDate, endDate } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));
          const visibilityFilter =
            aiSecurityService.getDealsVisibilityFilter(userContext);

          const whereClause: any = { ...visibilityFilter };
          if (stage) whereClause.stage = stage;
          if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt.gte = new Date(startDate);
            if (endDate) whereClause.createdAt.lte = new Date(endDate);
          }

          const deals = await prisma.withTenantContext(
            { tenantId: userContext.tenantId },
            async (tx) =>
              tx.deal.findMany({
                where: whereClause,
                orderBy: { value: 'desc' },
                take: safeLimit,
                select: {
                  id: true,
                  name: true,
                  value: true,
                  stage: true,
                  expectedCloseDate: true,
                  company: { select: { name: true } },
                },
              }),
          );

          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ALLOWED',
            { count: deals.length },
          );

          return deals.map((d) => ({
            id: d.id,
            name: d.name,
            value: d.value ? Number(d.value) : 0,
            stage: d.stage,
            companyName: d.company?.name || null,
            expectedCloseDate: d.expectedCloseDate
              ? d.expectedCloseDate.toISOString()
              : null,
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(
            userContext,
            toolName,
            'ERROR',
            { error: e.message },
          );
          return { error: 'Failed to fetch top deals.', details: e.message };
        }
      },
    } as any),
  };
}
