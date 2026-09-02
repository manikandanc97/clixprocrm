import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deduplicateSubscriptions() {
  console.log('Starting Platform Subscriptions deduplication...');

  const tenants = await prisma.tenant.findMany({
    include: {
      platformSubscriptions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  console.log(`Found ${tenants.length} tenants in total.`);

  let removedCount = 0;
  let syncedCount = 0;

  for (const tenant of tenants) {
    const subs = tenant.platformSubscriptions;

    if (subs.length > 1) {
      // Keep the most recent subscription (or the first paid one if any)
      const primarySub = subs.find((s) => s.planId !== 'free') || subs[0];
      const duplicates = subs.filter((s) => s.id !== primarySub.id);

      for (const dup of duplicates) {
        // Re-link any invoices attached to duplicate sub to the primary sub
        await prisma.platformInvoice.updateMany({
          where: { subscriptionId: dup.id },
          data: { subscriptionId: primarySub.id },
        });

        await prisma.platformSubscription.delete({
          where: { id: dup.id },
        });
        removedCount++;
      }
    } else if (subs.length === 0) {
      // Create primary free tier subscription if missing
      const normPlan = tenant.plan || 'free';
      const now = new Date();
      const periodEnd = tenant.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.platformSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: normPlan,
          billingCycle: (tenant.billingCycle as any) || 'monthly',
          seats: 1,
          status: tenant.subscriptionStatus || 'ACTIVE',
          unitPrice: 0,
          recurringAmount: 0,
          currency: tenant.currency || 'INR',
          currentPeriodStart: tenant.createdAt || now,
          currentPeriodEnd: periodEnd,
        },
      });
      syncedCount++;
    }
  }

  const finalSubCount = await prisma.platformSubscription.count();
  console.log(`✓ Deduplication completed!`);
  console.log(`- Duplicates removed: ${removedCount}`);
  console.log(`- Missing subscriptions created: ${syncedCount}`);
  console.log(`- Final unique subscription count: ${finalSubCount} (across ${tenants.length} tenants)`);
}

deduplicateSubscriptions()
  .catch((err) => {
    console.error('Error deduplicating subscriptions:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
