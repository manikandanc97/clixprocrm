import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { performance } from 'perf_hooks';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  console.log('--- RUNNING REGRESSION SUITE ---');

  // Helper to measure
  async function measure(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      const duration = performance.now() - start;
      console.log(`[PASS] ${name} - ${duration.toFixed(2)}ms`);
    } catch (e: any) {
      console.error(`[FAIL] ${name} - ERROR: ${e.message}`);
    }
  }

  // 1. Auth/Me Simulation
  await measure('Auth/Me (User Fetch)', async () => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');
  });

  // 2. Dashboard Simulation
  await measure('Dashboard (Aggregations)', async () => {
    const tenantId = (await prisma.tenant.findFirst())?.id;
    if (tenantId) {
      await prisma.lead.count({ where: { tenantId } });
      await prisma.deal.count({ where: { tenantId } });
      await prisma.task.count({ where: { tenantId } });
    }
  });

  // 3. Pipeline Migration Check
  await measure('Pipeline Migration (Chunked)', async () => {
    const tenantId = (await prisma.tenant.findFirst())?.id;
    if (tenantId) {
      const leads = await prisma.lead.findMany({
        where: { tenantId },
        take: 100,
        orderBy: { id: 'asc' },
      });
      // Just fetching, not mutating to keep it safe.
    }
  });

  console.log('--- REGRESSION SUITE COMPLETE ---');
  await app.close();
}

bootstrap();
