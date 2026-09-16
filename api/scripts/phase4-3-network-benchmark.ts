import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function calculatePercentiles(latencies: number[]) {
  if (latencies.length === 0) {
    return { min: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const getPercentile = (p: number) => {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
  };

  return {
    min: Number(min.toFixed(2)),
    avg: Number(avg.toFixed(2)),
    p50: Number(getPercentile(50).toFixed(2)),
    p90: Number(getPercentile(90).toFixed(2)),
    p95: Number(getPercentile(95).toFixed(2)),
    p99: Number(getPercentile(99).toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

async function measureSequentialSelect1(iterations: number) {
  const latencies: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    latencies.push(performance.now() - t0);
  }
  return calculatePercentiles(latencies);
}

async function measureParallelSelect1(concurrency: number) {
  const latencies: number[] = [];
  const promises = Array.from({ length: concurrency }, async () => {
    const t0 = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    latencies.push(performance.now() - t0);
  });
  await Promise.all(promises);
  return calculatePercentiles(latencies);
}

async function measurePgStatActivity() {
  try {
    const stats: any[] = await prisma.$queryRaw`
      SELECT
        state,
        count(*)::int as count,
        count(*) FILTER (WHERE wait_event_type IS NOT NULL)::int as waiting_count
      FROM pg_stat_activity
      GROUP BY state;
    `;
    const maxConn: any[] = await prisma.$queryRaw`SHOW max_connections;`;
    return {
      stats,
      maxConnections: maxConn[0]?.max_connections || 'unknown',
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

async function measureSetConfigOverhead() {
  const tenantId = '176eb722-aa34-4bff-9f13-ae64bc86b89c';
  const userId = '8b4f21d8-ee61-4185-ae35-9db74fc4a9bd';

  // 1. Measure 3 separate roundtrips inside a transaction
  const separateLatencies: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.is_super_admin', 'false', true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    });
    separateLatencies.push(performance.now() - t0);
  }

  // 2. Measure 1 single combined query inside a transaction
  const combinedLatencies: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT
          set_config('app.current_tenant_id', ${tenantId}, true),
          set_config('app.is_super_admin', 'false', true),
          set_config('app.current_user_id', ${userId}, true);
      `;
    });
    combinedLatencies.push(performance.now() - t0);
  }

  return {
    separate3Queries: calculatePercentiles(separateLatencies),
    combined1Query: calculatePercentiles(combinedLatencies),
  };
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 4.3 — INFRASTRUCTURE & NETWORK LATENCY BENCHMARK');
  console.log('================================================================');

  console.log('\n--- 1. PG_STAT_ACTIVITY TELEMETRY ---');
  const activity = await measurePgStatActivity();
  console.log('PostgreSQL Connection Stats:', JSON.stringify(activity, null, 2));

  console.log('\n--- 2. SEQUENTIAL SELECT 1 ROUNDTRIP LATENCY (NETWORK RTT) ---');
  console.log('Testing 10 iterations...');
  const seq10 = await measureSequentialSelect1(10);
  console.log('10 Iterations:', seq10);

  console.log('Testing 50 iterations...');
  const seq50 = await measureSequentialSelect1(50);
  console.log('50 Iterations:', seq50);

  console.log('Testing 100 iterations...');
  const seq100 = await measureSequentialSelect1(100);
  console.log('100 Iterations:', seq100);

  console.log('\n--- 3. PARALLEL SELECT 1 ROUNDTRIP LATENCY ---');
  for (const concurrency of [5, 10, 25, 50]) {
    const par = await measureParallelSelect1(concurrency);
    console.log(`Parallel ${concurrency} concurrent queries:`, par);
  }

  console.log('\n--- 4. RLS SET_CONFIG TRANSACTION OVERHEAD COMPARISON ---');
  const setConfigRes = await measureSetConfigOverhead();
  console.log('3 Separate Queries in Tx (Current):', setConfigRes.separate3Queries);
  console.log('1 Combined Query in Tx (Optimized):', setConfigRes.combined1Query);
  const diffMs = setConfigRes.separate3Queries.p50 - setConfigRes.combined1Query.p50;
  const pct = ((diffMs / setConfigRes.separate3Queries.p50) * 100).toFixed(1);
  console.log(`Potential latency savings per transaction: ${diffMs.toFixed(2)} ms (${pct}% reduction)`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
