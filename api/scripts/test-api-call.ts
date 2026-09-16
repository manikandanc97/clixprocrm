import { getBenchmarkAuth } from './benchmark-auth';

async function test() {
  const auth = await getBenchmarkAuth();
  console.log('Got auth:', auth.userId, auth.tenantId);
  const t0 = performance.now();
  try {
    const res = await fetch('http://localhost:4000/api/crm/leads?page=1&limit=20', {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'x-tenant-id': auth.tenantId,
      },
    });
    const dur = performance.now() - t0;
    console.log('Status:', res.status, 'Time:', dur.toFixed(2), 'ms');
    const body = await res.json();
    console.log('Body:', JSON.stringify(body).slice(0, 200));
  } catch (err: any) {
    console.error('Fetch failed:', err.message, err.cause || '');
  }
}

test().catch(console.error);
