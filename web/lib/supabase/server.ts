import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            const isRememberCookie = cookieStore.get('clixpro_remember_me')?.value === '1'
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOpts = { ...options }
              if (cookieOpts.maxAge !== 0) {
                if (isRememberCookie) {
                  cookieOpts.maxAge = 30 * 24 * 60 * 60
                } else {
                  delete cookieOpts.maxAge
                  delete cookieOpts.expires
                }
              }
              cookieStore.set(name, value, cookieOpts)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
