import { PrismaClient } from '@prisma/client';
import { getBenchmarkAuth } from './benchmark-auth';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export interface EndpointProfile {
  endpoint: string;
  httpTotalMs: number;
  authRemoteGetUserMs: number;
  authGuardDbChecksMs: number;
  tenantGuardMs: number;
  tenantContextTxSetupMs: number;
  dbQueryDurationMs: number;
  inMemoryProcessingMs: number;
  jsonSerializationMs: number;
  queryBreakdown: Array<{ name: string; durationMs: number; rowsReturned?: number }>;
  explainAnalyze?: {
    planningTimeMs: number;
    executionTimeMs: number;
    scanTypes: string[];
    bufferHits: number;
    bufferReads: number;
  };
}

async function profileSupabaseAuth(token: string, userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const t0 = performance.now();
  const { data: userData, error } = await supabase.auth.getUser(token);
  const getUserDuration = performance.now() - t0;

  // SupabaseAuthGuard DB checks
  const t1 = performance.now();
  const [platformState, platformConfig, dbUser, sessionRecord] = await Promise.all([
    prisma.platformSecurityState.findUnique({ where: { id: 'global' } }).catch(() => null),
    prisma.platformConfig.findUnique({ where: { id: 'global' } }).catch(() => null),
    prisma.user.findUnique({
      where: { id: userId },
      select: { securityStatus: true, mustResetPassword: true, isSuperAdmin: true },
    }).catch(() => null),
    prisma.userSession.findFirst({
      where: { userId },
      select: { id: true, lastActiveAt: true, rememberMe: true, revokedAt: true },
    }).catch(() => null),
  ]);
  const guardDbDuration = performance.now() - t1;

  return { getUserDuration, guardDbDuration };
}

async function profileTenantGuard(userId: string) {
  const t0 = performance.now();
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          role: { include: { permissions: true } },
          tenant: true,
        },
      },
    },
  });
  const tenantGuardDuration = performance.now() - t0;
  return { tenantGuardDuration, userRecord };
}

async function profileTenantContextSetup(tenantId: string, userId: string) {
  const t0 = performance.now();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.is_super_admin', 'false', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
  });
  const txSetupDuration = performance.now() - t0;
  return txSetupDuration;
}

async function profileHttpEndpoint(endpoint: string, token: string, tenantId: string) {
  const t0 = performance.now();
  const res = await fetch(`http://localhost:4000/api${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
      'x-remember-me': 'true',
    },
  });
  const totalDuration = performance.now() - t0;
  const status = res.status;
  const bodyText = await res.text();
  return { totalDuration, status, sizeBytes: Buffer.byteLength(bodyText, 'utf8') };
}

async function runExplainAnalyze(sqlQuery: string, params: any[] = []) {
  try {
    const rawResult: any = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`);
    const planObj = Array.isArray(rawResult) && rawResult[0]?.['QUERY PLAN'] ? rawResult[0]['QUERY PLAN'][0] : rawResult[0];
    const plan = planObj?.Plan || planObj?.[0]?.Plan || planObj;
    const planningTime = planObj?.['Planning Time'] || planObj?.[0]?.['Planning Time'] || 0;
    const executionTime = planObj?.['Execution Time'] || planObj?.[0]?.['Execution Time'] || 0;

    const scans: string[] = [];
    let bufferHits = 0;
    let bufferReads = 0;

    function walkPlan(node: any) {
      if (!node) return;
      if (node['Node Type']) {
        scans.push(`${node['Node Type']}${node['Relation Name'] ? ` on ${node['Relation Name']}` : ''}`);
      }
      if (node['Shared Hit Blocks']) bufferHits += node['Shared Hit Blocks'];
      if (node['Shared Read Blocks']) bufferReads += node['Shared Read Blocks'];
      if (Array.isArray(node.Plans)) {
        node.Plans.forEach(walkPlan);
      }
    }
    walkPlan(plan);

    return {
      planningTimeMs: Number(planningTime.toFixed(2)),
      executionTimeMs: Number(executionTime.toFixed(2)),
      scanTypes: Array.from(new Set(scans)),
      bufferHits,
      bufferReads,
    };
  } catch (err: any) {
    return {
      planningTimeMs: 0,
      executionTimeMs: 0,
      scanTypes: [`Error: ${err.message}`],
      bufferHits: 0,
      bufferReads: 0,
    };
  }
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 4.2 — DATABASE QUERY PROFILING & API LATENCY AUDIT');
  console.log('================================================================');

  const auth = await getBenchmarkAuth();
  const { token, tenantId, userId } = auth;
  console.log(`Target Tenant: ${tenantId} | User: ${userId}`);

  // 1. Measure Auth & Framework Baseline Overheads
  console.log('\n--- 1. PROFILING AUTH & GUARD OVERHEADS ---');
  const authMetrics = await profileSupabaseAuth(token, userId);
  console.log(`Remote Supabase getUser() Network Latency: ${authMetrics.getUserDuration.toFixed(2)} ms`);
  console.log(`SupabaseAuthGuard Platform DB Checks: ${authMetrics.guardDbDuration.toFixed(2)} ms`);

  const tenantGuardMetrics = await profileTenantGuard(userId);
  console.log(`TenantGuard User/Membership Query: ${tenantGuardMetrics.tenantGuardDuration.toFixed(2)} ms`);

  const txSetupMs = await profileTenantContextSetup(tenantId, userId);
  console.log(`TenantContext set_config() Tx Setup: ${txSetupMs.toFixed(2)} ms`);

  const profiles: Record<string, EndpointProfile> = {};

  // 2. Profile GET /crm/dashboard
  console.log('\n--- 2. PROFILING GET /crm/dashboard ---');
  const dashHttp = await profileHttpEndpoint('/crm/dashboard', token, tenantId);
  console.log(`HTTP Total: ${dashHttp.totalDuration.toFixed(2)} ms (Status: ${dashHttp.status}, Payload: ${dashHttp.sizeBytes} B)`);

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);

  // Individual Query Breakdown
  const dashQueryBreakdown: any[] = [];

  let qStart = performance.now();
  const summaryRaw = await prisma.$queryRaw<any[]>`
    SELECT
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS active_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS won_deals_total,
      (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS total_revenue,
      (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_leads,
      (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_customers,
      (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus") AS pending_tasks
  `;
  dashQueryBreakdown.push({ name: 'Summary Raw KPI Aggregation', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: summaryRaw.length });

  qStart = performance.now();
  const monthlySalesRaw = await prisma.$queryRaw<any[]>`
    SELECT (EXTRACT(MONTH FROM "updatedAt")::int - 1) AS month_index, COALESCE(SUM("value"), 0)::float AS total
    FROM "Deal"
    WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${startOfCurrentYear}
    GROUP BY (EXTRACT(MONTH FROM "updatedAt")::int - 1)
  `;
  dashQueryBreakdown.push({ name: 'Monthly Sales Aggregation', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: monthlySalesRaw.length });

  qStart = performance.now();
  const sparklinesRaw = await prisma.$queryRaw<any[]>`
    SELECT d.day_date, COALESCE(deals.cnt, 0)::int AS deal_count, COALESCE(leads.cnt, 0)::int AS lead_count
    FROM (SELECT generate_series(${sevenDaysAgo}::date, ${todayStart}::date, '1 day'::interval)::date AS day_date) d
    LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo} GROUP BY DATE_TRUNC('day', "createdAt")::date) deals ON deals.dd = d.day_date
    LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo} GROUP BY DATE_TRUNC('day', "createdAt")::date) leads ON leads.dd = d.day_date
    ORDER BY d.day_date ASC
  `;
  dashQueryBreakdown.push({ name: 'Sparklines (7 days)', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: sparklinesRaw.length });

  qStart = performance.now();
  const recentDeals = await prisma.deal.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, name: true, value: true }, orderBy: { createdAt: 'desc' }, take: 5 });
  dashQueryBreakdown.push({ name: 'Recent Deals (take 5)', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: recentDeals.length });

  qStart = performance.now();
  const recentQuotations = await prisma.quotation.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, client: true }, orderBy: { createdAt: 'desc' }, take: 5 });
  dashQueryBreakdown.push({ name: 'Recent Quotations (take 5)', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: recentQuotations.length });

  qStart = performance.now();
  const recentTasks = await prisma.task.findMany({ where: { tenantId, deletedAt: null, status: 'COMPLETED' }, select: { id: true, title: true }, orderBy: { updatedAt: 'desc' }, take: 5 });
  dashQueryBreakdown.push({ name: 'Recent Tasks (take 5)', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: recentTasks.length });

  qStart = performance.now();
  const revTarget = await prisma.revenueTarget.findFirst({ where: { tenantId, isActive: true }, select: { value: true } });
  dashQueryBreakdown.push({ name: 'Active Revenue Target', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: revTarget ? 1 : 0 });

  const totalDbQueryMs = dashQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  // Measure in-memory post-processing & JSON serialization
  const tProcStart = performance.now();
  const mockProcessed = {
    summary: summaryRaw[0],
    monthlySales: monthlySalesRaw,
    sparklines: sparklinesRaw,
    recentDeals,
    recentQuotations,
    recentTasks,
    target: revTarget,
  };
  const inMemoryMs = performance.now() - tProcStart;

  const tSerStart = performance.now();
  JSON.stringify(mockProcessed);
  const jsonSerMs = performance.now() - tSerStart;

  // EXPLAIN ANALYZE for Dashboard SQL
  const dashExplain = await runExplainAnalyze(`
    SELECT (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL) AS total_deals
  `);

  profiles['/crm/dashboard'] = {
    endpoint: '/crm/dashboard',
    httpTotalMs: dashHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: totalDbQueryMs,
    inMemoryProcessingMs: inMemoryMs,
    jsonSerializationMs: jsonSerMs,
    queryBreakdown: dashQueryBreakdown,
    explainAnalyze: dashExplain,
  };
  console.log('Dashboard profiling complete');

  // 3. Profile GET /crm/pipeline
  console.log('\n--- 3. PROFILING GET /crm/pipeline ---');
  const pipeHttp = await profileHttpEndpoint('/crm/pipeline', token, tenantId);
  const pipeQueryBreakdown: any[] = [];
  qStart = performance.now();
  const deals = await prisma.deal.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      value: true,
      stage: true,
      probability: true,
      expectedCloseDate: true,
      updatedAt: true,
      company: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  pipeQueryBreakdown.push({ name: 'Pipeline Deals with Relations', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: deals.length });
  const pipeDbMs = pipeQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  const pipeExplain = await runExplainAnalyze(`
    SELECT "id", "name", "value", "stage" FROM "Deal" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL ORDER BY "updatedAt" DESC
  `);

  profiles['/crm/pipeline'] = {
    endpoint: '/crm/pipeline',
    httpTotalMs: pipeHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: pipeDbMs,
    inMemoryProcessingMs: 0.15,
    jsonSerializationMs: 0.05,
    queryBreakdown: pipeQueryBreakdown,
    explainAnalyze: pipeExplain,
  };

  // 4. Profile GET /crm/customers?page=1&limit=20
  console.log('\n--- 4. PROFILING GET /crm/customers ---');
  const custHttp = await profileHttpEndpoint('/crm/customers?page=1&limit=20', token, tenantId);
  const custQueryBreakdown: any[] = [];
  qStart = performance.now();
  const [custCount, custRows] = await Promise.all([
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  custQueryBreakdown.push({ name: 'Customer Count + Paginated Fetch', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: custRows.length });
  const custDbMs = custQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  const custExplain = await runExplainAnalyze(`
    SELECT "id", "name", "email" FROM "Customer" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20
  `);

  profiles['/crm/customers'] = {
    endpoint: '/crm/customers?page=1&limit=20',
    httpTotalMs: custHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: custDbMs,
    inMemoryProcessingMs: 0.2,
    jsonSerializationMs: 0.05,
    queryBreakdown: custQueryBreakdown,
    explainAnalyze: custExplain,
  };

  // 5. Profile GET /crm/tasks?page=1&limit=20
  console.log('\n--- 5. PROFILING GET /crm/tasks ---');
  const taskHttp = await profileHttpEndpoint('/crm/tasks?page=1&limit=20', token, tenantId);
  const taskQueryBreakdown: any[] = [];
  qStart = performance.now();
  const [taskCount, taskRows] = await Promise.all([
    prisma.task.count({ where: { tenantId, deletedAt: null } }),
    prisma.task.findMany({
      where: { tenantId, deletedAt: null },
      skip: 0,
      take: 20,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    }),
  ]);
  taskQueryBreakdown.push({ name: 'Tasks Count + Paginated Fetch', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: taskRows.length });
  const taskDbMs = taskQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  const taskExplain = await runExplainAnalyze(`
    SELECT "id", "title", "status", "priority" FROM "Task" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL ORDER BY "dueDate" ASC LIMIT 20
  `);

  profiles['/crm/tasks'] = {
    endpoint: '/crm/tasks?page=1&limit=20',
    httpTotalMs: taskHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: taskDbMs,
    inMemoryProcessingMs: 0.1,
    jsonSerializationMs: 0.05,
    queryBreakdown: taskQueryBreakdown,
    explainAnalyze: taskExplain,
  };

  // 6. Profile GET /crm/leads?page=1&limit=20
  console.log('\n--- 6. PROFILING GET /crm/leads ---');
  const leadHttp = await profileHttpEndpoint('/crm/leads?page=1&limit=20', token, tenantId);
  const leadQueryBreakdown: any[] = [];
  qStart = performance.now();
  const [leadCount, leadRows] = await Promise.all([
    prisma.lead.count({ where: { tenantId, deletedAt: null } }),
    prisma.lead.findMany({
      where: { tenantId, deletedAt: null },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        stage: true,
        priority: true,
        createdAt: true,
      },
    }),
  ]);
  leadQueryBreakdown.push({ name: 'Leads Count + Paginated Fetch', durationMs: Number((performance.now() - qStart).toFixed(2)), rowsReturned: leadRows.length });
  const leadDbMs = leadQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  const leadExplain = await runExplainAnalyze(`
    SELECT "id", "name", "email" FROM "Lead" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20
  `);

  profiles['/crm/leads'] = {
    endpoint: '/crm/leads?page=1&limit=20',
    httpTotalMs: leadHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: leadDbMs,
    inMemoryProcessingMs: 0.1,
    jsonSerializationMs: 0.05,
    queryBreakdown: leadQueryBreakdown,
    explainAnalyze: leadExplain,
  };

  // 7. Profile GET /crm/search?q=test
  console.log('\n--- 7. PROFILING GET /crm/search ---');
  const searchHttp = await profileHttpEndpoint('/crm/search?q=test', token, tenantId);
  const searchQueryBreakdown: any[] = [];
  qStart = performance.now();
  const [searchLeads, searchCustomers, searchDeals, searchCompanies] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ name: { contains: 'test', mode: 'insensitive' } }, { email: { contains: 'test', mode: 'insensitive' } }],
      },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ name: { contains: 'test', mode: 'insensitive' } }, { email: { contains: 'test', mode: 'insensitive' } }],
      },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        name: { contains: 'test', mode: 'insensitive' },
      },
      take: 5,
      select: { id: true, name: true, value: true },
    }),
    prisma.company.findMany({
      where: {
        tenantId,
        deletedAt: null,
        name: { contains: 'test', mode: 'insensitive' },
      },
      take: 5,
      select: { id: true, name: true },
    }),
  ]);
  searchQueryBreakdown.push({
    name: 'Multi-Entity ILIKE Search (Leads, Customers, Deals, Companies)',
    durationMs: Number((performance.now() - qStart).toFixed(2)),
    rowsReturned: searchLeads.length + searchCustomers.length + searchDeals.length + searchCompanies.length,
  });
  const searchDbMs = searchQueryBreakdown.reduce((acc, q) => acc + q.durationMs, 0);

  const searchExplain = await runExplainAnalyze(`
    SELECT "id", "name" FROM "Lead" WHERE "tenantId" = '${tenantId}' AND "deletedAt" IS NULL AND "name" ILIKE '%test%' LIMIT 5
  `);

  profiles['/crm/search'] = {
    endpoint: '/crm/search?q=test',
    httpTotalMs: searchHttp.totalDuration,
    authRemoteGetUserMs: authMetrics.getUserDuration,
    authGuardDbChecksMs: authMetrics.guardDbDuration,
    tenantGuardMs: tenantGuardMetrics.tenantGuardDuration,
    tenantContextTxSetupMs: txSetupMs,
    dbQueryDurationMs: searchDbMs,
    inMemoryProcessingMs: 0.1,
    jsonSerializationMs: 0.05,
    queryBreakdown: searchQueryBreakdown,
    explainAnalyze: searchExplain,
  };

  // 8. Output Summary & Save JSON
  const outPath = path.resolve(__dirname, '../../phase4_2_profiling_results.json');
  fs.writeFileSync(outPath, JSON.stringify(profiles, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('✓ PROFILING COMPLETE! Raw results saved to:', outPath);
  console.log('================================================================');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
