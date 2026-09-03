import { createBrowserClient } from '@supabase/ssr';

function parseCookies(cookieHeader: string): Array<{ name: string; value: string }> {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf('=');
      if (idx === -1) return { name: c, value: '' };
      return {
        name: c.slice(0, idx).trim(),
        value: c.slice(idx + 1).trim(),
      };
    });
}

function serializeCookie(name: string, value: string, options: any = {}): string {
  let cookieStr = `${name}=${value}; Path=${options.path || '/'}; SameSite=${options.sameSite || 'Lax'}`;
  if (options.secure || (typeof window !== 'undefined' && window.location.protocol === 'https:')) {
    cookieStr += '; Secure';
  }
  if (typeof options.maxAge === 'number') {
    cookieStr += `; Max-Age=${options.maxAge}`;
  }
  if (options.domain) {
    cookieStr += `; Domain=${options.domain}`;
  }
  return cookieStr;
}

function initBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return parseCookies(document.cookie);
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          const isRemembered =
            typeof window !== 'undefined' &&
            localStorage.getItem('clixpro_remember_me') === '1';

          if (isRemembered) {
            document.cookie = serializeCookie('clixpro_remember_me', '1', {
              maxAge: 30 * 24 * 60 * 60,
              path: '/',
              sameSite: 'Lax',
            });
          } else {
            document.cookie = serializeCookie('clixpro_remember_me', '', {
              maxAge: 0,
              path: '/',
              sameSite: 'Lax',
            });
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOpts = { ...options };
            if (cookieOpts.maxAge === 0) {
              // Explicit cookie removal
              cookieOpts.maxAge = 0;
            } else if (isRemembered) {
              // 30 days persistent cookie
              cookieOpts.maxAge = 30 * 24 * 60 * 60;
            } else {
              // Session cookie (cleared when browser session ends)
              delete cookieOpts.maxAge;
              delete cookieOpts.expires;
            }
            document.cookie = serializeCookie(name, value, cookieOpts);
          });
        },
      },
    }
  );
}

let clientInstance: ReturnType<typeof initBrowserClient> | null = null;

export function createClient() {
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }

  const client = initBrowserClient();

  if (typeof window !== 'undefined') {
    clientInstance = client;
  }

  return client;
}
