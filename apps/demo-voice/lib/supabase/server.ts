import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { loadAuthConfig } from '@thrivereflections/realtime-config'

export async function createClient() {
  const cookieStore = await cookies()
  const authConfig = loadAuthConfig()

  const supabaseUrl = authConfig.supabase?.url
  const supabaseAnonKey = authConfig.supabase?.anonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
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
