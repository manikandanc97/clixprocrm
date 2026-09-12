import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const E2E_SUPABASE_ID = '8b4f21d8-ee61-4185-ae35-9db74fc4a9bd';
  const E2E_EMAIL = 'testadmin@clixprocrm.com';
  const E2E_NAME = 'E2E Test Admin';

  // 1. Ensure User record exists
  let user = await prisma.user.findUnique({ where: { email: E2E_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: E2E_SUPABASE_ID,
        email: E2E_EMAIL,
        name: E2E_NAME,
        isSuperAdmin: false,
        status: 'ACTIVE',
      },
    });
    console.log('✓ Created User:', user.id, user.email);
  } else {
    console.log('✓ User already exists:', user.id, user.email);
    // Ensure status is ACTIVE
    await prisma.user.update({
      where: { email: E2E_EMAIL },
      data: { status: 'ACTIVE', isSuperAdmin: false },
    });
  }

  // 2. Find an existing tenant to attach to (prefer any active tenant)
  const tenant = await prisma.tenant.findFirst({
    where: { status: { not: 'SUSPENDED' } },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenant) {
    console.error('No active tenant found! Cannot create membership.');
    console.log('Available tenants:');
    const allTenants = await prisma.tenant.findMany({ select: { id: true, name: true, status: true } });
    console.log(JSON.stringify(allTenants, null, 2));
    return;
  }

  console.log(`✓ Found tenant: ${tenant.id} (${tenant.name})`);

  // 3. Find the ADMIN role for this tenant (or any admin-like role)
  const adminRole = await prisma.role.findFirst({
    where: {
      tenantId: tenant.id,
      name: { in: ['ADMIN', 'Admin', 'admin', 'MANAGER', 'Manager'] },
    },
    orderBy: { name: 'asc' },
  });

  if (!adminRole) {
    // List available roles for this tenant
    const availRoles = await prisma.role.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
    });
    console.log('Available roles for this tenant:', JSON.stringify(availRoles, null, 2));
    
    if (availRoles.length === 0) {
      console.error('No roles found for this tenant. Cannot create TenantUser membership.');
      return;
    }
    
    // Use first available role
    const firstRole = availRoles[0];
    console.log(`✓ Using role: ${firstRole.name} (${firstRole.id})`);
    await createMembership(user.id, tenant.id, firstRole.id, E2E_EMAIL);
  } else {
    console.log(`✓ Found ADMIN role: ${adminRole.name} (${adminRole.id})`);
    await createMembership(user.id, tenant.id, adminRole.id, E2E_EMAIL);
  }
}

async function createMembership(
  userId: string,
  tenantId: string,
  roleId: string,
  _email: string,
): Promise<void> {
  const existing = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });

  if (existing) {
    const updated = await prisma.tenantUser.update({
      where: { tenantId_userId: { tenantId, userId } },
      data: { roleId, status: 'ACTIVE', isOrgOwner: true },
    });
    console.log('✓ Updated TenantUser membership:', updated.tenantId, updated.userId);
  } else {
    const created = await prisma.tenantUser.create({
      data: {
        tenantId,
        userId,
        roleId,
        status: 'ACTIVE',
        isOrgOwner: true,
      },
    });
    console.log('✓ Created TenantUser membership:', created.tenantId, created.userId);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
