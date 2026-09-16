import { runLoadTest, BenchmarkResult } from './benchmark-runner';
import { getBenchmarkAuth } from './benchmark-auth';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('================================================================');
  console.log('PHASE 4.3 — OPTIMIZED BEFORE/AFTER BENCHMARK MATRIX');
  console.log('================================================================');

  const auth = await getBenchmarkAuth();
  console.log(`Authenticated as User: ${auth.userId} | Tenant: ${auth.tenantId}`);

  const commonHeaders = {
    Authorization: `Bearer ${auth.token}`,
    'x-tenant-id': auth.tenantId,
    'x-remember-me': 'true',
  };

  // Warmup
  try {
    await fetch('http://localhost:4000/api/crm/leads?page=1&limit=20', {
      headers: commonHeaders,
    });
  } catch {}

  const endpoints = [
    { name: 'Dashboard', path: '/crm/dashboard' },
    { name: 'Pipeline', path: '/crm/pipeline' },
    { name: 'Customers', path: '/crm/customers?page=1&limit=20' },
    { name: 'Tasks', path: '/crm/tasks?page=1&limit=20' },
    { name: 'Leads', path: '/crm/leads?page=1&limit=20' },
    { name: 'Search', path: '/crm/search?q=test' },
  ];

  const results: Record<string, BenchmarkResult[]> = {};

  for (const ep of endpoints) {
    results[ep.name] = [];
    console.log(`\nBenchmarking ${ep.name} (${ep.path})...`);
    for (const vus of [1, 5, 10, 25, 50]) {
      process.stdout.write(`  ${vus} VUs (4s)... `);
      const res = await runLoadTest({
        endpointName: `${ep.name} (${vus} VUs)`,
        endpoint: ep.path,
        vus,
        durationSeconds: 4,
        headers: commonHeaders,
      });
      results[ep.name].push(res);
      console.log(`RPS: ${res.rps} | p50: ${res.latency.p50}ms | p95: ${res.latency.p95}ms | Errors: ${res.errorRatePercent}% [${JSON.stringify(res.statusCodes)}]`);
    }
  }

  const outPath = path.resolve(__dirname, '../../phase4_3_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\n================================================================');
  console.log('✓ PHASE 4.3 BENCHMARK COMPLETE! Saved to:', outPath);
  console.log('================================================================');
}

main().catch(console.error);
