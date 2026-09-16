import { getBenchmarkAuth } from './benchmark-auth';
import * as fs from 'fs';
import * as path from 'path';
import { runLoadTest, BenchmarkResult } from './benchmark-runner';

async function runCrmDbBenchmark() {
  console.log('Authenticating benchmark user...');
  const auth = await getBenchmarkAuth();
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'x-tenant-id': auth.tenantId,
  };

  console.log('Warming up guard and database connections...');
  await fetch('http://localhost:4000/api/crm/leads?page=1&limit=20', { headers });
  await fetch('http://localhost:4000/api/crm/customers?page=1&limit=20', { headers });
  await fetch('http://localhost:4000/api/crm/tasks?page=1&limit=20', { headers });

  const crmEndpoints = [
    { name: 'Leads (Paginated)', path: '/crm/leads?page=1&limit=20' },
    { name: 'Customers (Paginated)', path: '/crm/customers?page=1&limit=20' },
    { name: 'Tasks (Paginated)', path: '/crm/tasks?page=1&limit=20' },
    { name: 'Global Search', path: '/crm/search?q=test' },
  ];

  const crmResults: BenchmarkResult[] = [];

  for (const ep of crmEndpoints) {
    console.log(`\n--- Testing ${ep.name} (${ep.path}) ---`);
    for (const vus of [1, 2, 5]) {
      process.stdout.write(`  Running ${vus} VUs for 8s (timeout: 20s)... `);
      const res = await runLoadTest({
        endpointName: ep.name,
        endpoint: ep.path,
        vus,
        durationSeconds: 8,
        headers,
        timeoutMs: 20000,
      });
      crmResults.push(res);
      console.log(`Done! RPS: ${res.rps} | p50: ${res.latency.p50}ms | p95: ${res.latency.p95}ms | Errors: ${res.errorRatePercent}% [${JSON.stringify(res.statusCodes)}]`);
    }
  }

  const outPath = path.resolve(__dirname, '../../benchmark_crm_db_results.json');
  fs.writeFileSync(outPath, JSON.stringify(crmResults, null, 2), 'utf8');
  console.log(`\nSaved CRM DB benchmark results to ${outPath}`);
}

runCrmDbBenchmark().catch(console.error);
