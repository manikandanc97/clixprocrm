import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seedAdminForEmail(
  supabase: any,
  email: string,
  name: string,
  password?: string,
) {
  console.log(`\nProcessing Super Admin privileges for: ${email}...`);

  let authUserId: string | null = null;

  // 1. First check if user exists in Supabase auth.users via direct database query
  try {
    const authRows: Array<{ id: string; email: string }> =
      await prisma.$queryRawUnsafe(
        `SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        email,
      );

    if (authRows && authRows.length > 0) {
      authUserId = authRows[0].id;
      console.log(`Found existing Supabase auth user with ID: ${authUserId}`);

      // Update Supabase auth user metadata directly in DB
      await prisma.$queryRawUnsafe(
        `UPDATE auth.users 
         SET raw_user_meta_data = jsonb_set(
           COALESCE(raw_user_meta_data, '{}'::jsonb), 
           '{isSuperAdmin}', 
           'true'::jsonb
         )
         WHERE id = $1::uuid;`,
        authUserId,
      );
    }
  } catch (dbErr: any) {
    console.warn(`Direct auth.users query notice: ${dbErr?.message || dbErr}`);
  }

  // 2. If not found via direct DB, try Supabase Admin API
  if (!authUserId && supabase) {
    try {
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
      );

      if (existing) {
        authUserId = existing.id;
        if (password) {
          await supabase.auth.admin.updateUserById(authUserId, {
            password,
            email_confirm: true,
            user_metadata: { name, isSuperAdmin: true },
          });
        }
      } else if (password) {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, isSuperAdmin: true },
        });
        if (!error && data?.user) {
          authUserId = data.user.id;
          console.log(`Created Supabase auth user: ${email} (${authUserId})`);
        }
      }
    } catch (apiErr: any) {
      console.warn(`Supabase Admin API note: ${apiErr?.message || apiErr}`);
    }
  }

  // 3. Upsert user in Prisma
  if (authUserId) {
    // Check if user already exists with a different ID (e.g. created previously by seed)
    const existingPrismaUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingPrismaUser && existingPrismaUser.id !== authUserId) {
      // Update ID to match Supabase auth ID
      await prisma.user.delete({ where: { id: existingPrismaUser.id } }).catch(() => {});
    }

    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        id: authUserId,
        name: existingPrismaUser?.name || name,
        isSuperAdmin: true,
        status: 'ACTIVE',
      },
      create: {
        id: authUserId,
        email,
        name,
        isSuperAdmin: true,
        status: 'ACTIVE',
      },
    });

    console.log(`✓ Super Admin synchronized in database: ${dbUser.email} (ID: ${dbUser.id})`);
  } else {
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        isSuperAdmin: true,
        status: 'ACTIVE',
      },
      create: {
        email,
        name,
        isSuperAdmin: true,
        status: 'ACTIVE',
      },
    });
    console.log(`✓ Super Admin updated in Prisma: ${dbUser.email} (ID: ${dbUser.id})`);
  }
}

async function main() {
  const canonicalEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@clixprocrm.com').toLowerCase().trim();
  const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123456';
  const defaultName = process.env.SUPER_ADMIN_NAME || 'ClixPro Platform Admin';

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  let supabase: any = null;
  if (supabaseUrl && serviceRoleKey) {
    try {
      supabase = createClient(supabaseUrl, serviceRoleKey);
    } catch (e) {
      console.warn('Could not initialize Supabase client, continuing with direct DB mode');
    }
  }

  console.log('==========================================');
  console.log('Enforcing Exactly ONE Canonical Super Admin');
  console.log('==========================================');

  // 1. Demote any other users currently marked as Super Admin to maintain the invariant
  const secondaryAdmins = await prisma.user.findMany({
    where: {
      isSuperAdmin: true,
      email: { not: canonicalEmail },
    },
  });

  if (secondaryAdmins.length > 0) {
    console.log(`Found ${secondaryAdmins.length} secondary Super Admin(s). Demoting to standard platform role...`);
    for (const sec of secondaryAdmins) {
      await prisma.user.update({
        where: { id: sec.id },
        data: { isSuperAdmin: false },
      });
      console.log(`  ✓ Safely demoted: ${sec.email} (Preserved tenant memberships and CRM data)`);

      // Demote in Supabase auth metadata if present
      try {
        await prisma.$queryRawUnsafe(
          `UPDATE auth.users 
           SET raw_user_meta_data = jsonb_set(
             COALESCE(raw_user_meta_data, '{}'::jsonb), 
             '{isSuperAdmin}', 
             'false'::jsonb
           )
           WHERE LOWER(email) = LOWER($1);`,
          sec.email,
        );
      } catch {}
    }
  }

  // 2. Seed the single canonical platform Super Admin
  await seedAdminForEmail(supabase, canonicalEmail, defaultName, defaultPassword);

  // Summary of all Super Admins
  const allSuperAdmins = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    select: { id: true, email: true, name: true, status: true, isSuperAdmin: true },
  });

  console.log('\n==========================================');
  console.log('Active Super Admins in ClixPro CRM:');
  console.log('==========================================');
  allSuperAdmins.forEach((admin, i) => {
    console.log(`${i + 1}. ${admin.email} (${admin.name || 'No Name'}) - ID: ${admin.id} [${admin.status}]`);
  });
  console.log('==========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding Super Admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
