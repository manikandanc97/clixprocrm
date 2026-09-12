/**
 * generate-auth-state.mjs
 * 
 * Uses the Supabase Admin API (service-role key) to sign in as the
 * test user WITHOUT triggering the MFA challenge. This produces a
 * valid Playwright storageState JSON file at playwright/.auth/user.json
 * that can be reused by all test specs.
 *
 * Usage:
 *   node scripts/generate-auth-state.mjs
 *
 * The script auto-detects expiry so tests only call it when the stored
 * session is expired (< 5 min remaining on the JWT).
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_KEY or SUPABASE_SECRET_KEY environment variable'
  );
}

const TEST_EMAIL    = process.env.TEST_USER_EMAIL    || 'superadmin@clixprocrm.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin@123456';

const AUTH_FILE = path.join(__dirname, '../playwright/.auth/user.json');
const COOKIE_NAME = `sb-oscksafwlfkpqvifcvae-auth-token`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function isStorageStateFresh(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!content?.cookies?.length) return false;
    const authCookie = content.cookies.find(c => c.name.includes('auth-token'));
    if (!authCookie?.value) return false;
    const raw = authCookie.value.startsWith('base64-')
      ? Buffer.from(authCookie.value.slice(7), 'base64').toString('utf8')
      : decodeURIComponent(authCookie.value);
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token) return false;
    const payloadB64 = parsed.access_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - nowSec;
    if (remaining > 300) {
      console.log(`✓ Stored session still valid (${Math.round(remaining / 60)} min remaining). Reusing.`);
      return true;
    }
    console.log(`✗ Stored JWT expired or near-expiry (${remaining}s remaining). Refreshing...`);
    return false;
  } catch (e) {
    console.log('✗ Could not parse stored session:', e.message);
    return false;
  }
}

function buildStorageState(session) {
  // Encode the full session as Supabase expects: "base64-<b64>"
  const tokenJson = JSON.stringify({
    access_token:  session.access_token,
    token_type:    session.token_type,
    expires_in:    session.expires_in,
    expires_at:    session.expires_at,
    refresh_token: session.refresh_token,
    user:          session.user,
  });
  const cookieValue = 'base64-' + Buffer.from(tokenJson).toString('base64');

  return {
    cookies: [
      {
        name:     COOKIE_NAME,
        value:    cookieValue,
        domain:   'localhost',
        path:     '/',
        expires:  -1,           // session cookie
        httpOnly: false,
        secure:   false,
        sameSite: 'Lax',
      },
    ],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'has_session', value: '1' },
        ],
      },
    ],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (isStorageStateFresh(AUTH_FILE)) {
    process.exit(0);
  }

  console.log(`Signing in as ${TEST_EMAIL} via Supabase Admin API (MFA-bypass)…`);

  // Use the anon client for regular sign-in first
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('signInWithPassword failed:', error.message);
    process.exit(1);
  }

  if (!data?.session) {
    console.error('No session returned from signInWithPassword');
    process.exit(1);
  }

  const session = data.session;
  console.log(`✓ Got AAL1 session. Access token expires: ${new Date(session.expires_at * 1000).toISOString()}`);

  // Check if MFA (AAL2) is required
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
    console.log('ℹ  SuperAdmin requires AAL2 (TOTP). Attempting admin generateLink to get a usable session…');
    
    // Use admin client to generate a magic link token, then exchange it
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Use admin.generateLink to create a session that bypasses MFA
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: TEST_EMAIL,
      options: {
        data: { skipMfa: true },
      },
    });

    if (linkErr) {
      console.error('generateLink failed:', linkErr.message);
      console.log('⚠  Falling back to AAL1 session (app will show MFA modal, tests use locator handlers)');
      // Write AAL1 session anyway — tests handle the MFA modal via locatorHandler
    } else {
      console.log('✓ Generated magic link. Extracting token…');
      const url = new URL(linkData.properties?.action_link || '');
      const token = url.searchParams.get('token');
      
      if (token) {
        const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
          type: 'magiclink',
          token_hash: token,
        });
        if (!verifyErr && verifyData?.session) {
          Object.assign(session, verifyData.session);
          console.log('✓ Magic-link session verified successfully');
        }
      }
    }
  }

  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const storageState = buildStorageState(session);
  fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2), 'utf8');
  console.log(`✓ Saved storageState to ${AUTH_FILE}`);
}

main().catch(err => {
  console.error('Fatal error generating auth state:', err);
  process.exit(1);
});
