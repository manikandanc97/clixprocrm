import * as dotenv from 'dotenv';
import * as path from 'path';
import * as net from 'net';
import * as tls from 'tls';
import { PrismaClient } from '@prisma/client';

// Load environment variables safely
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface RedisCheckResult {
  configured: boolean;
  hostType: 'none' | 'localhost' | 'hosted';
  safeHost: string;
  port: number;
  tlsEnabled: boolean;
  connected: boolean;
  latencyMs: number | null;
  error?: string;
}

interface DatabaseCheckResult {
  configured: boolean;
  safeHost: string;
  port: number;
  sslMode: string;
  poolerMode: boolean;
  connected: boolean;
  select1LatencyMs: number | null;
  retryCount: number;
  error?: string;
}

async function checkRedis(): Promise<RedisCheckResult> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return {
      configured: false,
      hostType: 'none',
      safeHost: 'not configured (defaults to 127.0.0.1:6379 in non-production)',
      port: 6379,
      tlsEnabled: false,
      connected: false,
      latencyMs: null,
    };
  }

  try {
    const parsed = new URL(redisUrl);
    const isTls = parsed.protocol === 'rediss:';
    const host = parsed.hostname || '127.0.0.1';
    const port = parsed.port ? parseInt(parsed.port, 10) : 6379;
    const isLocal =
      host === '127.0.0.1' || host === 'localhost' || host === '::1';

    const t0 = Date.now();
    const connectPromise = new Promise<{ connected: boolean; latency: number }>(
      (resolve, reject) => {
        let socket: net.Socket;
        const onConnect = () => {
          const latency = Date.now() - t0;
          socket.destroy();
          resolve({ connected: true, latency });
        };

        if (isTls) {
          socket = tls.connect(
            { host, port, rejectUnauthorized: false, timeout: 5000 },
            onConnect,
          );
        } else {
          socket = net.createConnection({ host, port, timeout: 5000 }, onConnect);
        }

        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Connection timed out after 5000ms'));
        });
      },
    );

    const res = await connectPromise;
    return {
      configured: true,
      hostType: isLocal ? 'localhost' : 'hosted',
      safeHost: host,
      port,
      tlsEnabled: isTls,
      connected: res.connected,
      latencyMs: res.latency,
    };
  } catch (err: any) {
    let host = 'unknown';
    let port = 6379;
    let isTls = false;
    try {
      const parsed = new URL(redisUrl);
      host = parsed.hostname;
      port = parsed.port ? parseInt(parsed.port, 10) : 6379;
      isTls = parsed.protocol === 'rediss:';
    } catch {}

    return {
      configured: true,
      hostType: host === '127.0.0.1' || host === 'localhost' ? 'localhost' : 'hosted',
      safeHost: host,
      port,
      tlsEnabled: isTls,
      connected: false,
      latencyMs: null,
      error: err.message || 'Connection failed',
    };
  }
}

async function checkDatabase(): Promise<DatabaseCheckResult> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      configured: false,
      safeHost: 'not configured',
      port: 5432,
      sslMode: 'none',
      poolerMode: false,
      connected: false,
      select1LatencyMs: null,
      retryCount: 0,
      error: 'DATABASE_URL environment variable is missing',
    };
  }

  let safeHost = 'unknown';
  let port = 5432;
  let sslMode = 'unknown';
  let poolerMode = false;

  try {
    const parsed = new URL(dbUrl);
    safeHost = parsed.hostname;
    port = parsed.port ? parseInt(parsed.port, 10) : 5432;
    sslMode = parsed.searchParams.get('sslmode') || 'default';
    poolerMode = parsed.searchParams.get('pgbouncer') === 'true' || port === 6543;
  } catch {}

  const prisma = new PrismaClient();
  let retryCount = 0;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const t0 = Date.now();
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      const latency = Date.now() - t0;
      await prisma.$disconnect();

      return {
        configured: true,
        safeHost,
        port,
        sslMode,
        poolerMode,
        connected: true,
        select1LatencyMs: latency,
        retryCount,
      };
    } catch (err: any) {
      retryCount = attempt;
      if (attempt === maxRetries) {
        await prisma.$disconnect().catch(() => {});
        return {
          configured: true,
          safeHost,
          port,
          sslMode,
          poolerMode,
          connected: false,
          select1LatencyMs: null,
          retryCount,
          error: err.message,
        };
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await prisma.$disconnect().catch(() => {});
  return {
    configured: true,
    safeHost,
    port,
    sslMode,
    poolerMode,
    connected: false,
    select1LatencyMs: null,
    retryCount,
  };
}

async function runDiagnostics() {
  console.log('================================================================');
  console.log(' CLIXPRO CRM — INFRASTRUCTURE CONNECTION DIAGNOSTICS (PHASE 4.3.1)');
  console.log('================================================================\n');

  console.log('[1/2] Checking Redis Connection Infrastructure...');
  const redisResult = await checkRedis();
  console.log('  - Redis Configured :', redisResult.configured ? 'YES' : 'NO (Using non-production fallback)');
  console.log('  - Host Type        :', redisResult.hostType);
  console.log('  - Safe Hostname    :', redisResult.safeHost);
  console.log('  - Port             :', redisResult.port);
  console.log('  - TLS Enabled      :', redisResult.tlsEnabled ? 'YES' : 'NO');
  console.log('  - Connection State :', redisResult.connected ? 'CONNECTED (PASS)' : 'UNREACHABLE / STANDBY');
  if (redisResult.latencyMs !== null) {
    console.log('  - Socket Latency   :', `${redisResult.latencyMs} ms`);
  }
  if (redisResult.error) {
    console.log('  - Notice           :', redisResult.error);
  }

  console.log('\n[2/2] Checking PostgreSQL / Prisma Connection Infrastructure...');
  const dbResult = await checkDatabase();
  console.log('  - DB Configured    :', dbResult.configured ? 'YES' : 'NO');
  console.log('  - Safe Hostname    :', dbResult.safeHost);
  console.log('  - Port             :', dbResult.port);
  console.log('  - SSL Mode         :', dbResult.sslMode);
  console.log('  - Supavisor Pooler :', dbResult.poolerMode ? 'YES (Port 6543 / PgBouncer)' : 'NO (Direct / Session)');
  console.log('  - Connection State :', dbResult.connected ? 'CONNECTED (PASS)' : 'FAILED');
  if (dbResult.select1LatencyMs !== null) {
    console.log('  - Query Latency    :', `${dbResult.select1LatencyMs} ms (SELECT 1)`);
  }
  console.log('  - Retries Needed   :', dbResult.retryCount);
  if (dbResult.error) {
    console.log('  - Error Detail     :', dbResult.error);
  }

  console.log('\n================================================================');
  console.log(' DIAGNOSTICS SUMMARY');
  console.log('================================================================');
  console.log(` Database Connectivity : ${dbResult.connected ? 'HEALTHY (PASS)' : 'CRITICAL ERROR'}`);
  console.log(` Redis Infrastructure  : ${redisResult.connected ? 'HEALTHY (TCP ACTIVE)' : (redisResult.configured ? 'OFFLINE' : 'STANDBY (In-memory/Bounded Fallback Active)')}`);
  console.log(' Zero credentials or secret tokens exposed.\n');
}

runDiagnostics().catch((err) => {
  console.error('Fatal diagnostics runner error:', err.message);
  process.exit(1);
});
