import { tool } from 'ai';
import { z } from 'zod';

export interface McpUserContext {
  authToken: string;
  userId?: string;
  tenantId?: string;
  role?: string;
  correlationId?: string;
}

const CRM_API_BASE_URL =
  process.env.CRM_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api';

/**
 * Sanitizes headers and scrubs sensitive tokens from error messages.
 */
function scrubError(text: string): string {
  if (!text) return 'An unexpected error occurred.';
  return text
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g, '[REDACTED_TOKEN]')
    .replace(/PrismaClientKnownRequestError/i, 'DatabaseError')
    .replace(/SELECT\s+.+\s+FROM/gi, '[QUERY_REDACTED]');
}

/**
 * Dispatches an authenticated HTTP request to the ClixProCRM API gateway on behalf of the user.
 */
async function callCrmApi(
  context: McpUserContext,
  endpoint: string,
  method = 'GET',
  body?: unknown,
  query?: Record<string, string | number | boolean | undefined | null>
): Promise<any> {
  const cleanBase = CRM_API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${cleanBase}${cleanPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (context.authToken) {
    headers['Authorization'] = `Bearer ${context.authToken}`;
  }
  if (context.correlationId) {
    headers['X-Correlation-ID'] = context.correlationId;
    headers['X-Request-ID'] = context.correlationId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `CRM API responded with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData?.message) {
          errorMsg = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : String(errorData.message);
        }
      } catch {
        // Fall back to status text
      }

      if (res.status === 401) {
        return { error: 'Authentication expired or invalid. Please sign in again.' };
      }
      if (res.status === 403) {
        return { error: 'Permission denied: Your role does not allow this operation.' };
      }
      if (res.status === 404) {
        return { error: 'Resource not found in CRM.' };
      }
      if (res.status === 429) {
        return { error: 'Rate limit exceeded. Please wait a moment before trying again.' };
      }
      if (res.status >= 500) {
        return { error: 'CRM service is temporarily unavailable. Please try again shortly.' };
      }

      return { error: scrubError(errorMsg) };
    }

    const data = await res.json();
    return data?.data !== undefined ? data.data : data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { error: 'Request to CRM service timed out. Please try again.' };
    }
    return { error: 'Could not connect to CRM backend service. Please check your network connection.' };
  }
}

/**
 * Builds the authorized MCP tools for the current authenticated user context.
 */
export function getMcpTools(context: McpUserContext) {
  return {
    // 1. get_current_user (Read)
    get_current_user: tool({
      description: "Get the authenticated user's permitted CRM profile.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await callCrmApi(context, '/auth/me', 'GET');
        return data;
      },
    }),

    // 2. list_leads (Read)
    list_leads: tool({
      description: 'List leads accessible to the user with optional filters.',
      inputSchema: z.object({
        search: z.string().max(100).optional().describe('Search by lead name, email, or company'),
        status: z.string().max(50).optional().describe('Filter by lead stage/status (e.g. NEW, QUALIFIED, WON, LOST)'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Number of leads to retrieve'),
        sort: z.string().max(50).optional().describe('Sort order field'),
      }),
      execute: async (args: { search?: string; status?: string; page?: number; limit?: number; sort?: string }) => {
        const data = await callCrmApi(context, '/crm/leads', 'GET', undefined, {
          search: args.search,
          status: args.status,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
          sort: args.sort,
        });
        return data;
      },
    }),

    // 3. get_lead (Read)
    get_lead: tool({
      description: 'Get details of a single lead by its unique ID.',
      inputSchema: z.object({
        id: z.string().min(1).max(100).describe('The unique ID of the lead'),
      }),
      execute: async ({ id }: { id: string }) => {
        const data = await callCrmApi(context, `/crm/leads/${encodeURIComponent(id)}`, 'GET');
        return data;
      },
    }),

    // 4. create_lead (Controlled Write)
    create_lead: tool({
      description:
        'Create a new lead. Explicit confirmation (confirmed === true) is required before executing the creation.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Lead contact full name'),
        email: z.string().email().max(200).describe('Lead email address'),
        company: z.string().max(200).optional().describe('Company or organization'),
        phone: z.string().max(50).optional().describe('Phone number'),
        source: z.string().max(100).optional().describe('Lead source'),
        stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        value: z.number().min(0).optional().describe('Estimated budget or deal value'),
        expectedCloseDate: z.string().max(50).optional().describe('Target close date (YYYY-MM-DD)'),
        tags: z.array(z.string().max(50)).max(20).optional().describe('Tags'),
        confirmed: z
          .boolean()
          .describe('Explicit confirmation must be true to authorize CRM lead creation'),
      }),
      execute: async (args: any) => {
        if (args.confirmed !== true) {
          return {
            confirmationRequired: true,
            message: 'Confirmation is required before creating this lead. Please confirm details with the user.',
            proposedData: {
              name: args.name,
              email: args.email,
              company: args.company,
              value: args.value,
              stage: args.stage,
            },
          };
        }
        const { confirmed, ...payload } = args;
        const data = await callCrmApi(context, '/crm/leads', 'POST', payload);
        return data;
      },
    }),

    // 5. update_lead (Controlled Write)
    update_lead: tool({
      description:
        'Update an existing lead. Explicit confirmation (confirmed === true) is required before updating.',
      inputSchema: z.object({
        id: z.string().min(1).max(100).describe('The unique ID of the lead to update'),
        name: z.string().min(1).max(200).optional(),
        company: z.string().max(200).optional(),
        email: z.string().email().max(200).optional(),
        phone: z.string().max(50).optional(),
        stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        value: z.number().min(0).optional(),
        expectedCloseDate: z.string().max(50).optional(),
        notes: z.string().max(2000).optional(),
        confirmed: z
          .boolean()
          .describe('Explicit confirmation must be true to authorize CRM lead update'),
      }),
      execute: async (args: any) => {
        if (args.confirmed !== true) {
          return {
            confirmationRequired: true,
            message: 'Confirmation is required before modifying this lead. Please confirm with the user.',
            leadId: args.id,
          };
        }
        const { id, confirmed, ...payload } = args;
        const data = await callCrmApi(context, `/crm/leads/${encodeURIComponent(id)}`, 'PUT', payload);
        return data;
      },
    }),

    // 6. list_customers (Read)
    list_customers: tool({
      description: 'List customers accessible to the user with optional filters.',
      inputSchema: z.object({
        search: z.string().max(100).optional().describe('Search by customer name, company, or email'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Max customers to retrieve'),
        sort: z.string().max(50).optional().describe('Sort order field'),
      }),
      execute: async (args: { search?: string; page?: number; limit?: number; sort?: string }) => {
        const data = await callCrmApi(context, '/crm/customers', 'GET', undefined, {
          search: args.search,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
          sort: args.sort,
        });
        return data;
      },
    }),

    // 7. get_customer (Read)
    get_customer: tool({
      description: 'Get details of a single customer by ID.',
      inputSchema: z.object({
        id: z.string().min(1).max(100).describe('The unique ID of the customer'),
      }),
      execute: async ({ id }: { id: string }) => {
        const data = await callCrmApi(context, `/crm/customers/${encodeURIComponent(id)}`, 'GET');
        return data;
      },
    }),

    // 8. create_customer (Controlled Write)
    create_customer: tool({
      description:
        'Create a new customer account. Explicit confirmation (confirmed === true) is required before creation.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Customer contact name'),
        company: z.string().min(1).max(200).describe('Customer company name'),
        email: z.string().email().max(200).optional().describe('Email address'),
        revenue: z.number().min(0).optional().describe('Annual or estimated revenue'),
        status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'VIP']).optional(),
        confirmed: z
          .boolean()
          .describe('Explicit confirmation must be true to authorize CRM customer creation'),
      }),
      execute: async (args: any) => {
        if (args.confirmed !== true) {
          return {
            confirmationRequired: true,
            message: 'Confirmation is required before creating this customer. Please confirm with the user.',
            proposedData: {
              name: args.name,
              company: args.company,
              email: args.email,
            },
          };
        }
        const { confirmed, ...payload } = args;
        const data = await callCrmApi(context, '/crm/customers', 'POST', payload);
        return data;
      },
    }),

    // 9. update_customer (Controlled Write)
    update_customer: tool({
      description:
        'Update an existing customer account. Explicit confirmation (confirmed === true) is required before updating.',
      inputSchema: z.object({
        id: z.string().min(1).max(100).describe('The unique ID of the customer to update'),
        name: z.string().min(1).max(200).optional(),
        company: z.string().max(200).optional(),
        email: z.string().email().max(200).optional(),
        revenue: z.number().min(0).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'VIP']).optional(),
        confirmed: z
          .boolean()
          .describe('Explicit confirmation must be true to authorize CRM customer update'),
      }),
      execute: async (args: any) => {
        if (args.confirmed !== true) {
          return {
            confirmationRequired: true,
            message: 'Confirmation is required before modifying this customer. Please confirm with the user.',
            customerId: args.id,
          };
        }
        const { id, confirmed, ...payload } = args;
        const data = await callCrmApi(context, `/crm/customers/${encodeURIComponent(id)}`, 'PUT', payload);
        return data;
      },
    }),

    // 10. list_deals (Read)
    list_deals: tool({
      description: 'List deals accessible to the authenticated user with optional filters.',
      inputSchema: z.object({
        search: z.string().max(100).optional().describe('Search term for deals'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Number of deals to retrieve'),
      }),
      execute: async (args: { search?: string; page?: number; limit?: number }) => {
        const data = await callCrmApi(context, '/crm/deals', 'GET', undefined, {
          search: args.search,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
        });
        return data;
      },
    }),

    // 11. get_pipeline (Read)
    get_pipeline: tool({
      description: 'Get sales pipeline overview and deals by stage.',
      inputSchema: z.object({}),
      execute: async () => {
        const data = await callCrmApi(context, '/crm/pipeline', 'GET');
        return data;
      },
    }),

    // 12. list_tasks (Read)
    list_tasks: tool({
      description: 'List tasks and action items assigned to or accessible by the user.',
      inputSchema: z.object({
        search: z.string().max(100).optional().describe('Search query for tasks'),
        status: z.string().max(50).optional().describe('Filter by status (e.g. PENDING, COMPLETED)'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Max tasks to retrieve'),
      }),
      execute: async (args: { search?: string; status?: string; page?: number; limit?: number }) => {
        const data = await callCrmApi(context, '/crm/tasks', 'GET', undefined, {
          search: args.search,
          status: args.status,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
        });
        return data;
      },
    }),

    // 13. get_sales_report (Read)
    get_sales_report: tool({
      description: 'Get sales performance, revenue summaries, and report analytics.',
      inputSchema: z.object({
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async (args: { startDate?: string; endDate?: string }) => {
        const data = await callCrmApi(context, '/crm/reports', 'GET', undefined, {
          startDate: args.startDate,
          endDate: args.endDate,
        });
        return data;
      },
    }),

    // 14. list_quotations (Read)
    list_quotations: tool({
      description: 'List quotations and proposals accessible to the authenticated user.',
      inputSchema: z.object({
        search: z.string().max(100).optional().describe('Search term'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Number of quotations to retrieve'),
      }),
      execute: async (args: { search?: string; page?: number; limit?: number }) => {
        const data = await callCrmApi(context, '/crm/quotations', 'GET', undefined, {
          search: args.search,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
        });
        return data;
      },
    }),

    // --- SUPER ADMIN PLATFORM INTELLIGENCE TOOLS ---

    // 15. get_platform_overview (Super Admin Read)
    get_platform_overview: tool({
      description: 'Get platform-wide executive metrics: total/active organizations, users, CRM volume, plan distribution, and recent tenants.',
      inputSchema: z.object({}),
      execute: async () => {
        const data = await callCrmApi(context, '/super-admin/dashboard', 'GET');
        return data;
      },
    }),

    // 16. get_platform_analytics (Super Admin Read)
    get_platform_analytics: tool({
      description: 'Get platform financial metrics: MRR, ARR in INR, monthly organization and user growth trends, and plan breakdown.',
      inputSchema: z.object({}),
      execute: async () => {
        const data = await callCrmApi(context, '/super-admin/analytics', 'GET');
        return data;
      },
    }),

    // 17. list_platform_organizations (Super Admin Read)
    list_platform_organizations: tool({
      description: 'Filter and list tenant organizations across the entire platform with pagination and status/plan filtering.',
      inputSchema: z.object({
        search: z.string().optional().describe('Search organization name or slug'),
        status: z.enum(['ACTIVE', 'SUSPENDED']).optional().describe('Filter by tenant status'),
        plan: z.string().optional().describe('Filter by subscription plan e.g. free, starter, pro, enterprise'),
        page: z.number().int().min(1).default(1).optional().describe('Page number'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Max organizations to retrieve'),
      }),
      execute: async (args: { search?: string; status?: 'ACTIVE' | 'SUSPENDED'; plan?: string; page?: number; limit?: number }) => {
        const data = await callCrmApi(context, '/super-admin/organizations', 'GET', undefined, {
          search: args.search,
          status: args.status,
          plan: args.plan,
          page: args.page || 1,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
        });
        return data;
      },
    }),

    // 18. get_platform_security_status (Super Admin Read)
    get_platform_security_status: tool({
      description: 'Get platform security telemetry, active threat indicators, emergency status, and secops health.',
      inputSchema: z.object({}),
      execute: async () => {
        const [telemetry, incidents] = await Promise.all([
          callCrmApi(context, '/super-admin/security/operations/telemetry', 'GET').catch(() => null),
          callCrmApi(context, '/super-admin/security/incidents', 'GET').catch(() => null),
        ]);
        return { telemetry, incidents };
      },
    }),

    // 19. get_platform_audit_logs (Super Admin Read)
    get_platform_audit_logs: tool({
      description: 'Get recent security audit logs and administrative events across the platform with optional module filter.',
      inputSchema: z.object({
        module: z.string().optional().describe('Filter by module (e.g. AUTH, TENANT, USERS, SECURITY, SuperAdminAI)'),
        limit: z.number().int().min(1).max(50).default(10).optional().describe('Max audit logs to retrieve'),
      }),
      execute: async (args: { module?: string; limit?: number }) => {
        const data = await callCrmApi(context, '/super-admin/audit-logs', 'GET', undefined, {
          module: args.module,
          limit: Math.min(Math.max(1, args.limit || 10), 50),
        });
        return data;
      },
    }),

    // 20. get_platform_ai_metrics (Super Admin Read)
    get_platform_ai_metrics: tool({
      description: 'Get AI ecosystem status: global killswitch status, active AI models, plan tier quotas, and token rate limits.',
      inputSchema: z.object({}),
      execute: async () => {
        const data = await callCrmApi(context, '/super-admin/ai/overview', 'GET');
        return data;
      },
    }),
  };
}


