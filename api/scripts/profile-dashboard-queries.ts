import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function testProfile() {
  const tenantId = '176eb722-aa34-4bff-9f13-ae64bc86b89c';
  console.log('Testing each step of getDashboardData...');

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);

  console.log('1. Testing raw KPI query...');
  let t0 = performance.now();
  const summaryRaw = await prisma.$queryRaw<any[]>`
    SELECT
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS active_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage") AND "createdAt" < ${currentStart}) AS prev_active_deals,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS won_deals_total,
      (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'LOST'::"DealStage") AS lost_deals_total,
      (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS total_revenue,
      (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${currentStart} AND "updatedAt" < ${nextStart}) AS current_period_revenue,
      (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${previousStart} AND "updatedAt" < ${currentStart}) AS prev_period_revenue,
      (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_leads,
      (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_leads,
      (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_leads,
      (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_customers,
      (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_customers,
      (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus") AS pending_tasks_total,
      (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_pending_tasks,
      (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_pending_tasks
  `;
  console.log('1. Raw KPI query took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('2. Testing monthly sales query...');
  t0 = performance.now();
  const monthlySalesRaw = await prisma.$queryRaw<any[]>`
    SELECT
      (EXTRACT(MONTH FROM "updatedAt")::int - 1) AS month_index,
      COALESCE(SUM("value"), 0)::float AS total
    FROM "Deal"
    WHERE "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
      AND "stage" = 'WON'::"DealStage"
      AND "updatedAt" >= ${startOfCurrentYear}
    GROUP BY (EXTRACT(MONTH FROM "updatedAt")::int - 1)
  `;
  console.log('2. Monthly sales query took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('3. Testing sparklines query...');
  t0 = performance.now();
  const sparklinesRaw = await prisma.$queryRaw<any[]>`
    SELECT
      d.day_date,
      COALESCE(deals.cnt, 0)::int AS deal_count,
      COALESCE(rev.sum_val, 0)::float AS revenue_sum,
      COALESCE(leads.cnt, 0)::int AS lead_count
    FROM (
      SELECT generate_series(${sevenDaysAgo}::date, ${todayStart}::date, '1 day'::interval)::date AS day_date
    ) d
    LEFT JOIN (
      SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
      FROM "Deal"
      WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")::date
    ) deals ON deals.dd = d.day_date
    LEFT JOIN (
      SELECT DATE_TRUNC('day', "updatedAt")::date AS dd, SUM("value") AS sum_val
      FROM "Deal"
      WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "updatedAt")::date
    ) rev ON rev.dd = d.day_date
    LEFT JOIN (
      SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
      FROM "Lead"
      WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")::date
    ) leads ON leads.dd = d.day_date
    ORDER BY d.day_date ASC
  `;
  console.log('3. Sparklines query took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('4. Testing recentDeals...');
  t0 = performance.now();
  const recentDeals = await prisma.deal.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('4. Recent deals took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('5. Testing recentQuotations...');
  t0 = performance.now();
  const recentQuotations = await prisma.quotation.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, client: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('5. Recent quotations took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('6. Testing recentCompletedTasks...');
  t0 = performance.now();
  const recentCompletedTasks = await prisma.task.findMany({
    where: { tenantId, deletedAt: null, status: 'COMPLETED' },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
  console.log('6. Recent completed tasks took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('7. Testing active revenue target...');
  t0 = performance.now();
  const revTarget = await prisma.revenueTarget.findFirst({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { value: true },
  });
  console.log('7. Active revenue target took:', (performance.now() - t0).toFixed(2), 'ms');

  console.log('--- Testing Promise.all parallel execution of all 7 queries ---');
  t0 = performance.now();
  await Promise.all([
    prisma.$queryRaw`
      SELECT
        (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_deals,
        (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_deals,
        (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_deals
    `,
    prisma.deal.findMany({ where: { tenantId, deletedAt: null }, select: { id: true }, take: 5 }),
    prisma.quotation.findMany({ where: { tenantId, deletedAt: null }, select: { id: true }, take: 5 }),
    prisma.task.findMany({ where: { tenantId, deletedAt: null, status: 'COMPLETED' }, select: { id: true }, take: 5 }),
    prisma.revenueTarget.findFirst({ where: { tenantId, isActive: true }, select: { value: true } }),
  ]);
  console.log('Parallel execution took:', (performance.now() - t0).toFixed(2), 'ms');
}

testProfile()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
