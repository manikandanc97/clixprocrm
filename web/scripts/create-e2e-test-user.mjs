/**
 * create-e2e-test-user.mjs
 *
 * Provisions a dedicated E2E test admin user via the Supabase Admin API.
 * This user has NO MFA enrolled so Playwright can log in via simple
 * email/password without any TOTP challenge.
 *
 * User created: testadmin@clixprocrm.com / E2ETestAdmin@123456
 * Role: SUPER_ADMIN (same permissions as the real super admin for full coverage)
 *
 * Run once:
 *   node scripts/create-e2e-test-user.mjs
 *
 * The script is idempotent — it skips creation if the user already exists.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_KEY or SUPABASE_SECRET_KEY environment variable'
  );
}

const E2E_EMAIL    = process.env.TEST_USER_EMAIL    || 'testadmin@clixprocrm.com';
const E2E_PASSWORD = process.env.TEST_USER_PASSWORD || 'E2ETestAdmin@123456';
const E2E_NAME     = 'E2E Test Admin';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Provisioning E2E test user: ${E2E_EMAIL}`);

  // Check if user already exists by listing users and filtering
  let existingUserId = null;
  try {
    const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;
    const existing = listData?.users?.find(u => u.email?.toLowerCase() === E2E_EMAIL.toLowerCase());
    if (existing) {
      existingUserId = existing.id;
      console.log(`✓ User already exists with id: ${existingUserId}`);
    }
  } catch (e) {
    console.warn('Could not list users:', e.message);
  }

  let userId = existingUserId;

  if (!userId) {
    // Create the user via admin API — this sets a confirmed account with no MFA
    const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      email_confirm: true,           // auto-confirm email
      user_metadata: {
        name: E2E_NAME,
        isSuperAdmin: true,
        email_verified: true,
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
    });

    if (createErr) {
      console.error('Failed to create user:', createErr.message);
      process.exit(1);
    }

    userId = createData.user?.id;
    console.log(`✓ Created Supabase auth user: ${userId}`);
  } else {
    // Update password to ensure it matches
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: E2E_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: E2E_NAME,
        isSuperAdmin: true,
        email_verified: true,
      },
    });
    if (updateErr) {
      console.warn('Could not update existing user:', updateErr.message);
    } else {
      console.log(`✓ Updated existing user credentials`);
    }
  }

  // Now ensure the user exists in the ClixPro backend (NestJS/Prisma)
  // by calling the Supabase API to upsert the user into the app's user table.
  // We do this by calling the local API as the user.
  console.log(`\nSigning in as ${E2E_EMAIL} to trigger backend user provisioning...`);

  const anonClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zY2tzYWZ3bGZrcHF2aWZjdmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjU0NTAsImV4cCI6MjA5MjYwMTQ1MH0.sPWAYd62hP1Htlxa_9s2-T1ZzN9C5UbxHbiOatHFxZs', {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });

  if (signInErr) {
    console.warn('⚠ Could not sign in to trigger provisioning:', signInErr.message);
    console.log('This may require manual user setup in the backend DB.');
  } else {
    const token = signInData.session?.access_token;
    console.log(`✓ Sign-in successful. AAL: ${signInData.session?.amr ? JSON.stringify(signInData.session.amr) : 'N/A'}`);

    // Ping the /auth/me endpoint to trigger NestJS user creation
    try {
      const meResp = await fetch('http://localhost:4000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meBody = await meResp.json();
      if (meResp.ok && meBody?.data?.user) {
        console.log(`✓ Backend user provisioned: ${meBody.data.user.email} (role: ${meBody.data.user.role})`);
      } else {
        // 403 NEEDS_ONBOARDING or similar — this is expected for a brand new user
        // The backend auto-creates the user during onboarding, but for superadmin
        // we may need to insert directly via seed script.
        console.log(`⚠ Backend /auth/me response (${meResp.status}):`, JSON.stringify(meBody).substring(0, 200));
        console.log('  → The test user may need to be seeded into the Prisma DB manually.');
        console.log('  → Run: node scripts/seed-e2e-user.mjs  (or use the existing seed script)');
      }
    } catch (e) {
      console.warn('Could not reach backend at http://localhost:4000:', e.message);
    }
  }

  console.log('\n─────────────────────────────────────────────────');
  console.log('E2E Test User Summary:');
  console.log(`  Email:    ${E2E_EMAIL}`);
  console.log(`  Password: ${E2E_PASSWORD}`);
  console.log(`  Supabase ID: ${userId}`);
  console.log('  MFA: NONE (safe for automated tests)');
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
