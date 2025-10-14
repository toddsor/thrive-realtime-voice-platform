import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { syncUserToAppUser } from '@/lib/auth/userSync'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/demo'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Sync user to AppUser table
      await syncUserToAppUser(data.user)
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
