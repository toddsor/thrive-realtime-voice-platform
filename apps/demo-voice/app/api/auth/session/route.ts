import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserByAuthId } from '@/lib/auth/userSync'

export const runtime = 'edge'

export async function GET() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ user: null, error: error?.message || 'No user found' })
    }

    // Get user from AppUser table
    const appUser = await getUserByAuthId(user.id)
    
    return NextResponse.json({ 
      user: appUser || {
        sub: user.id,
        tenant: 'default',
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        provider: user.app_metadata?.provider
      },
      error: null 
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ user: null, error: 'Internal server error' }, { status: 500 })
  }
}
