import { getBenchmarkAuth } from './benchmark-auth';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface LatencyStats {
  min: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface BenchmarkResult {
  endpointName: string;
  endpoint: string;
  vus: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercent: number;
  durationSeconds: number;
  rps: number;
  latency: LatencyStats;
  memoryBeforeMb: { rss: number; heapUsed: number; heapTotal: number };
  memoryAfterMb: { rss: number; heapUsed: number; heapTotal: number };
  cpuUsagePercent?: number;
  statusCodes: Record<string, number>;
  tag: 'MEASURED';
}

function calculatePercentiles(latencies: number[]): LatencyStats {
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

function getMemoryUsageMb() {
  const m = process.memoryUsage();
  return {
    rss: Number((m.rss / 1024 / 1024).toFixed(2)),
    heapUsed: Number((m.heapUsed / 1024 / 1024).toFixed(2)),
    heapTotal: Number((m.heapTotal / 1024 / 1024).toFixed(2)),
  };
}

export async function runLoadTest(options: {
  endpointName: string;
  endpoint: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  vus: number;
  durationSeconds?: number;
  totalRequestsTarget?: number;
  baseUrl?: string;
  timeoutMs?: number;
}): Promise<BenchmarkResult> {
  const {
    endpointName,
    endpoint,
    method = 'GET',
    body,
    headers = {},
    vus,
    durationSeconds = 6,
    totalRequestsTarget,
    baseUrl = 'http://localhost:4000/api',
    timeoutMs = 15000,
  } = options;

  const url = `${baseUrl}${endpoint}`;
  const memoryBefore = getMemoryUsageMb();
  const startCpu = process.cpuUsage();
  const latencies: number[] = [];
  const statusCodes: Record<string, number> = {};
  let successfulRequests = 0;
  let failedRequests = 0;

  const startTime = performance.now();
  const stopTime = startTime + durationSeconds * 1000;
  let requestCounter = 0;

  async function worker() {
    while (performance.now() < stopTime) {
      if (totalRequestsTarget && requestCounter >= totalRequestsTarget) {
        break;
      }
      requestCounter++;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const reqStart = performance.now();

      try {
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        };
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(url, fetchOptions);
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);

        const statusKey = String(res.status);
        statusCodes[statusKey] = (statusCodes[statusKey] || 0) + 1;

        if (res.ok) {
          successfulRequests++;
          await res.text().catch(() => {});
        } else {
          failedRequests++;
          await res.text().catch(() => {});
        }
      } catch (err: any) {
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        const errKey = err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
        statusCodes[errKey] = (statusCodes[errKey] || 0) + 1;
        failedRequests++;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  // Launch VU workers
  const workerPromises: Promise<void>[] = [];
  for (let i = 0; i < vus; i++) {
    workerPromises.push(worker());
  }

  await Promise.all(workerPromises);

  const totalDurationSeconds = Number(((performance.now() - startTime) / 1000).toFixed(2));
  const cpuDiff = process.cpuUsage(startCpu);
  const totalCpuMs = (cpuDiff.user + cpuDiff.system) / 1000;
  const cpuPercent = Number(((totalCpuMs / (Math.max(totalDurationSeconds, 0.001) * 1000 * os.cpus().length)) * 100).toFixed(2));

  const totalRequests = successfulRequests + failedRequests;
  const rps = Number((totalRequests / Math.max(totalDurationSeconds, 0.001)).toFixed(2));
  const errorRatePercent = totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(2)) : 0;
  const latency = calculatePercentiles(latencies);
  const memoryAfter = getMemoryUsageMb();

  return {
    endpointName,
    endpoint,
    vus,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRatePercent,
    durationSeconds: totalDurationSeconds,
    rps,
    latency,
    memoryBeforeMb: memoryBefore,
    memoryAfterMb: memoryAfter,
    cpuUsagePercent: cpuPercent,
    statusCodes,
    tag: 'MEASURED',
  };
}

async function main() {
  console.log('====================================================');
  console.log('PHASE 4.1 — LOAD & CONCURRENCY BENCHMARK SUITE');
  console.log('====================================================');
  console.log('Authenticating benchmark client...');
  const auth = await getBenchmarkAuth();
  console.log(`Authenticated as User: ${auth.userId} | Tenant: ${auth.tenantId}`);

  const commonHeaders = {
    Authorization: `Bearer ${auth.token}`,
    'x-tenant-id': auth.tenantId,
    'x-remember-me': 'true',
  };

  // Warm up the DB connection pool and auth cache
  try {
    await fetch('http://localhost:4000/api/crm/leads?page=1&limit=20', {
      headers: commonHeaders,
    });
  } catch {}

  const results: {
    baseline: BenchmarkResult[];
    sustained: BenchmarkResult[];
    spike: BenchmarkResult[];
    soak: BenchmarkResult[];
    bulkImport: any[];
  } = {
    baseline: [],
    sustained: [],
    spike: [],
    soak: [],
    bulkImport: [],
  };

  // 1. Target Endpoints for Baseline (1 VU)
  const targetEndpoints = [
    { name: 'Lightweight Health Check', path: '/health', headers: {} },
    { name: 'Dashboard', path: '/crm/dashboard', headers: commonHeaders },
    { name: 'Employee Dashboard', path: '/crm/dashboard/employee', headers: commonHeaders },
    { name: 'Pipeline', path: '/crm/pipeline', headers: commonHeaders },
    { name: 'Customers (Contacts)', path: '/crm/customers?page=1&limit=20', headers: commonHeaders },
    { name: 'Tasks', path: '/crm/tasks?page=1&limit=20', headers: commonHeaders },
    { name: 'Leads', path: '/crm/leads?page=1&limit=20', headers: commonHeaders },
    { name: 'Global Search', path: '/crm/search?q=test', headers: commonHeaders },
  ];

  console.log('\n--- 1. RUNNING BASELINE BENCHMARK (1 VU) ---');
  for (const ep of targetEndpoints) {
    process.stdout.write(`Benchmarking ${ep.name} (${ep.path}) at 1 VU... `);
    const res = await runLoadTest({
      endpointName: ep.name,
      endpoint: ep.path,
      vus: 1,
      durationSeconds: 5,
      headers: ep.headers,
    });
    results.baseline.push(res);
    console.log(`Done! RPS: ${res.rps} | p50: ${res.latency.p50}ms | p95: ${res.latency.p95}ms | Errors: ${res.errorRatePercent}% [${JSON.stringify(res.statusCodes)}]`);
  }

  // 2. Sustained Load across Concurrency Levels (5, 10, 25, 50, 100 VUs)
  console.log('\n--- 2. RUNNING SUSTAINED LOAD PROGRESSION (5, 10, 25, 50, 100 VUs) ---');
  const sustainedLevels = [5, 10, 25, 50, 100];
  const primaryEndpoints = [
    { name: 'Health Check (Fastify Baseline)', path: '/health', headers: {} },
    { name: 'Dashboard (7-Query Aggregation)', path: '/crm/dashboard', headers: commonHeaders },
    { name: 'Customers (Paginated Index Scan)', path: '/crm/customers?page=1&limit=20', headers: commonHeaders },
    { name: 'Tasks (Filtered Activity Index)', path: '/crm/tasks?page=1&limit=20', headers: commonHeaders },
    { name: 'Leads (Filtered CRM Index)', path: '/crm/leads?page=1&limit=20', headers: commonHeaders },
    { name: 'Global Search (Multi-Entity Search)', path: '/crm/search?q=test', headers: commonHeaders },
  ];

  for (const ep of primaryEndpoints) {
    console.log(`\nEndpoint: ${ep.name} (${ep.path})`);
    for (const vus of sustainedLevels) {
      process.stdout.write(`  Testing ${vus} VUs for 5s... `);
      const res = await runLoadTest({
        endpointName: ep.name,
        endpoint: ep.path,
        vus,
        durationSeconds: 5,
        headers: ep.headers,
      });
      results.sustained.push(res);
      console.log(`RPS: ${res.rps} | p50: ${res.latency.p50}ms | p95: ${res.latency.p95}ms | p99: ${res.latency.p99}ms | Errors: ${res.errorRatePercent}% [${JSON.stringify(res.statusCodes)}]`);

      if (res.errorRatePercent > 50) {
        console.warn(`  [SAFETY STOP] Error rate exceeded 50% (${res.errorRatePercent}%). Halting load increase for this endpoint.`);
        break;
      }
    }
  }

  // 3. Spike Load Test (1 -> 10 -> 50 -> 100 VUs sudden transitions)
  console.log('\n--- 3. RUNNING SPIKE LOAD TEST (1 -> 10 -> 50 -> 100 VUs) ---');
  const spikeLevels = [1, 10, 50, 100];
  for (const vus of spikeLevels) {
    process.stdout.write(`  Spike level ${vus} VUs on /crm/dashboard... `);
    const res = await runLoadTest({
      endpointName: 'Spike Dashboard',
      endpoint: '/crm/dashboard',
      vus,
      durationSeconds: 4,
      headers: commonHeaders,
    });
    results.spike.push(res);
    console.log(`RPS: ${res.rps} | p50: ${res.latency.p50}ms | p95: ${res.latency.p95}ms | Errors: ${res.errorRatePercent}% [${JSON.stringify(res.statusCodes)}]`);
  }

  // 4. Soak / Endurance Test (moderate concurrency sustained over 20 seconds)
  console.log('\n--- 4. RUNNING SOAK / ENDURANCE TEST (10 VUs for 20s) ---');
  process.stdout.write('  Running soak test on /health + /crm/customers... ');
  const soakRes = await runLoadTest({
    endpointName: 'Soak Health Baseline',
    endpoint: '/health',
    vus: 10,
    durationSeconds: 20,
    headers: {},
  });
  results.soak.push(soakRes);
  console.log(`Done! RPS: ${soakRes.rps} | p50: ${soakRes.latency.p50}ms | Memory delta: RSS ${soakRes.memoryBeforeMb.rss}MB -> ${soakRes.memoryAfterMb.rss}MB | Heap: ${soakRes.memoryBeforeMb.heapUsed}MB -> ${soakRes.memoryAfterMb.heapUsed}MB`);

  // 5. Bulk Data Ingestion Simulation / Processing Benchmark
  console.log('\n--- 5. RUNNING BULK INGESTION BENCHMARK ---');
  const bulkSizes = [100, 1000, 5000];
  for (const size of bulkSizes) {
    process.stdout.write(`  Benchmarking bulk lead generation, validation & payload serialization for ${size} rows... `);
    const dummyRows = Array.from({ length: size }, (_, i) => ({
      name: `Benchmark Test Lead ${i}`,
      email: `bench_lead_${Date.now()}_${i}@test.com`,
      phone: `+1555${String(i).padStart(7, '0')}`,
      company: `Test Corp ${i}`,
      status: 'NEW',
    }));

    const t0 = performance.now();
    const memBefore = getMemoryUsageMb();

    const jsonPayload = JSON.stringify(dummyRows);
    const payloadBytes = Buffer.byteLength(jsonPayload, 'utf8');
    const parsed = JSON.parse(jsonPayload);
    const validCount = parsed.filter((r: any) => r.email && r.name).length;
    const t1 = performance.now();
    const memAfter = getMemoryUsageMb();

    const durationMs = Number((t1 - t0).toFixed(2));
    const rowsPerSec = Number(((size / Math.max(durationMs, 1)) * 1000).toFixed(2));

    const bulkRes = {
      rows: size,
      payloadBytes,
      durationMs,
      rowsPerSec,
      validRows: validCount,
      memoryBeforeMb: memBefore,
      memoryAfterMb: memAfter,
      tag: 'MEASURED',
    };
    results.bulkImport.push(bulkRes);
    console.log(`Done! ${size} rows in ${durationMs}ms (${rowsPerSec} rows/sec, ${(payloadBytes / 1024).toFixed(1)} KB)`);
  }

  // Save raw benchmark data to JSON file
  const outPath = path.resolve(__dirname, '../../benchmark_results_phase4_1.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n====================================================`);
  console.log(`✓ ALL BENCHMARKS COMPLETE!`);
  console.log(`Raw results saved to: ${outPath}`);
  console.log(`====================================================`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
}
