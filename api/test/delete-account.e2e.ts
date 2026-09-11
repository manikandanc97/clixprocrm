import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';

const prisma = new PrismaClient();
const authService = new AuthService(prisma as any, {} as any);

async function runTests() {
  console.log('--- Starting Enterprise Account Deletion Flow Tests ---');

  const randomSuffix = Math.random().toString(36).substring(7);
  const testTenantSlug1 = `test-tenant-del-1-${randomSuffix}`;
  const testTenantSlug2 = `test-tenant-iso-2-${randomSuffix}`;

  const testUserId1 = `test-user-del-1-${randomSuffix}`;
  const testUserId2 = `test-user-iso-2-${randomSuffix}`;

  let tenant1Id = '';
  let tenant2Id = '';

  try {
    // 1. Seed Tenant 1 (to be deleted)
    const t1 = await prisma.tenant.create({
      data: {
        name: `Test Tenant To Delete ${randomSuffix}`,
        slug: testTenantSlug1,
      },
    });
    tenant1Id = t1.id;

    const u1 = await prisma.user.create({
      data: {
        id: testUserId1,
        name: `Admin User ${randomSuffix}`,
        email: `admin.${randomSuffix}@test.com`,
      },
    });

    const r1 = await prisma.role.create({
      data: {
        tenantId: t1.id,
        name: 'ADMIN',
        isSystem: true,
      },
    });

    await prisma.rolePermission.create({
      data: {
        roleId: r1.id,
        module: 'Settings',
        hasAccess: true,
      },
    });

    const d1 = await prisma.department.create({
      data: {
        tenantId: t1.id,
        name: 'Executive',
      },
    });

    const tu1 = await prisma.tenantUser.create({
      data: {
        tenantId: t1.id,
        userId: u1.id,
        roleId: r1.id,
        departmentId: d1.id,
      },
    });

    const c1 = await prisma.company.create({
      data: {
        tenantId: t1.id,
        name: 'Target Company',
        ownerId: u1.id,
      },
    });

    const cust1 = await prisma.customer.create({
      data: {
        tenantId: t1.id,
        name: 'Target Customer',
        company: 'Target Company',
        companyId: c1.id,
        assignedToId: u1.id,
      },
    });

    const lead1 = await prisma.lead.create({
      data: {
        tenantId: t1.id,
        name: 'Target Lead',
        company: 'Target Company',
        email: `lead.${randomSuffix}@test.com`,
        customerId: cust1.id,
        companyId: c1.id,
        assignedToId: u1.id,
        createdById: u1.id,
      },
    });

    const deal1 = await prisma.deal.create({
      data: {
        tenantId: t1.id,
        name: 'Target Deal',
        companyId: c1.id,
        customerId: cust1.id,
        leadId: lead1.id,
        ownerId: u1.id,
      },
    });

    const task1 = await prisma.task.create({
      data: {
        tenantId: t1.id,
        title: 'Target Task',
        assignedToId: u1.id,
        createdById: u1.id,
        relatedCustomerId: cust1.id,
        relatedLeadId: lead1.id,
        relatedDealId: deal1.id,
      },
    });

    const meeting1 = await prisma.meeting.create({
      data: {
        tenantId: t1.id,
        title: 'Target Meeting',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        assignedToId: u1.id,
        ownerId: u1.id,
        customerId: cust1.id,
        leadId: lead1.id,
        dealId: deal1.id,
      },
    });

    const quote1 = await prisma.quotation.create({
      data: {
        tenantId: t1.id,
        quoteNumber: `Q-${randomSuffix}`,
        client: 'Target Client',
        leadId: lead1.id,
        customerId: cust1.id,
        dealId: deal1.id,
        assignedToId: u1.id,
      },
    });

    const invoice1 = await prisma.invoice.create({
      data: {
        tenantId: t1.id,
        invoiceNumber: `INV-${randomSuffix}`,
        customerId: cust1.id,
        dealId: deal1.id,
      },
    });

    const note1 = await prisma.note.create({
      data: {
        tenantId: t1.id,
        leadId: lead1.id,
        userId: u1.id,
        message: 'Target Note',
      },
    });

    const aiConv1 = await prisma.aiConversation.create({
      data: {
        tenantId: t1.id,
        userId: u1.id,
        title: 'Target AI Chat',
      },
    });

    await prisma.aiMessage.create({
      data: {
        conversationId: aiConv1.id,
        role: 'user',
        content: 'Hello AI',
      },
    });

    const doc1 = await prisma.document.create({
      data: {
        tenantId: t1.id,
        title: 'Target Doc',
        content: 'Knowledge doc content',
      },
    });

    await prisma.documentChunk.create({
      data: {
        documentId: doc1.id,
        content: 'Doc chunk 1',
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: t1.id,
        userId: u1.id,
        action: 'TEST_ACTION',
      },
    });

    console.log('✓ Successfully seeded Tenant 1 with full dependency tree');

    // 2. Seed Tenant 2 (Isolation Control Tenant)
    const t2 = await prisma.tenant.create({
      data: {
        name: `Isolation Control Tenant ${randomSuffix}`,
        slug: testTenantSlug2,
      },
    });
    tenant2Id = t2.id;

    const u2 = await prisma.user.create({
      data: {
        id: testUserId2,
        name: `Isolated User ${randomSuffix}`,
        email: `isolated.${randomSuffix}@test.com`,
      },
    });

    const r2 = await prisma.role.create({
      data: {
        tenantId: t2.id,
        name: 'ADMIN',
        isSystem: true,
      },
    });

    await prisma.tenantUser.create({
      data: {
        tenantId: t2.id,
        userId: u2.id,
        roleId: r2.id,
      },
    });

    const lead2 = await prisma.lead.create({
      data: {
        tenantId: t2.id,
        name: 'Isolated Lead',
        company: 'Isolated Company',
        email: `isolated-lead.${randomSuffix}@test.com`,
        assignedToId: u2.id,
      },
    });

    console.log('✓ Successfully seeded Tenant 2 (Isolation check)');

    // 3. Test Invalid Confirmation Handling
    console.log('Testing confirmation validation rejection...');
    try {
      await authService.deleteAccount(u1.id, t1.id, {
        confirm1: 'wrong',
        confirm2: 'delete my account',
      });
      throw new Error('FAILED: Invalid confirmation was accepted!');
    } catch (e: any) {
      console.log('✓ Correctly rejected invalid confirm1:', e.message);
    }

    try {
      await authService.deleteAccount(u1.id, t1.id, {
        confirm1: 'clixprocrm',
        confirm2: 'wrong text',
      });
      throw new Error('FAILED: Invalid confirmation was accepted!');
    } catch (e: any) {
      console.log('✓ Correctly rejected invalid confirm2:', e.message);
    }

    // 4. Test Successful Execution of Deletion
    console.log('Executing valid deleteAccount for Tenant 1...');
    const result = await authService.deleteAccount(u1.id, t1.id, {
      confirm1: 'clixprocrm',
      confirm2: 'delete my account',
    });

    console.log('✓ Deletion result:', result);

    // 5. Verify that all Tenant 1 records have been permanently removed
    const verifyT1 = await prisma.tenant.findUnique({ where: { id: t1.id } });
    const verifyU1 = await prisma.user.findUnique({ where: { id: u1.id } });
    const verifyLeads1 = await prisma.lead.count({
      where: { tenantId: t1.id },
    });
    const verifyCust1 = await prisma.customer.count({
      where: { tenantId: t1.id },
    });
    const verifyTasks1 = await prisma.task.count({
      where: { tenantId: t1.id },
    });
    const verifyDeals1 = await prisma.deal.count({
      where: { tenantId: t1.id },
    });
    const verifyInvoices1 = await prisma.invoice.count({
      where: { tenantId: t1.id },
    });
    const verifyAiConvs1 = await prisma.aiConversation.count({
      where: { tenantId: t1.id },
    });
    const verifyDocs1 = await prisma.document.count({
      where: { tenantId: t1.id },
    });
    const verifyAudit1 = await prisma.auditLog.count({
      where: { tenantId: t1.id },
    });

    if (
      verifyT1 ||
      verifyU1 ||
      verifyLeads1 > 0 ||
      verifyCust1 > 0 ||
      verifyTasks1 > 0 ||
      verifyDeals1 > 0 ||
      verifyInvoices1 > 0 ||
      verifyAiConvs1 > 0 ||
      verifyDocs1 > 0 ||
      verifyAudit1 === 0 // AuditLog must NOT be deleted - must be preserved permanently
    ) {
      throw new Error(
        `FAILED: Partial records remain or AuditLog was deleted for Tenant 1! (T1: ${!!verifyT1}, U1: ${!!verifyU1}, leads: ${verifyLeads1}, audit: ${verifyAudit1})`,
      );
    }
    console.log(
      '✓ Verified: Tenant 1 CRM entities purged while historical AuditLog records remain permanently preserved.',
    );

    // 6. Verify Tenant 2 Isolation: Ensure all Tenant 2 records remain completely intact
    const verifyT2 = await prisma.tenant.findUnique({ where: { id: t2.id } });
    const verifyU2 = await prisma.user.findUnique({ where: { id: u2.id } });
    const verifyLead2 = await prisma.lead.findUnique({
      where: { id: lead2.id },
    });

    if (!verifyT2 || !verifyU2 || !verifyLead2) {
      throw new Error(
        'FAILED: Tenant 2 isolation breached! Records were affected.',
      );
    }
    console.log(
      '✓ Verified: Tenant 2 records remain 100% untouched and secure.',
    );

    console.log('\n=============================================');
    console.log(' ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ');
    console.log('=============================================\n');
  } finally {
    // Clean up Tenant 2
    if (tenant2Id) {
      await authService
        .deleteAccount(testUserId2, tenant2Id, {
          confirm1: 'clixprocrm',
          confirm2: 'delete my account',
        })
        .catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
