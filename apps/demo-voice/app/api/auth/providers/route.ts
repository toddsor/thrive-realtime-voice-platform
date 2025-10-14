import { NextResponse } from 'next/server';

export async function GET() {
  // Check which OAuth providers are configured
  const providers = {
    google: {
      enabled: !!(process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID && process.env.SUPABASE_AUTH_GOOGLE_SECRET),
      clientId: process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID
    },
    linkedin: {
      enabled: !!(process.env.SUPABASE_AUTH_LINKEDIN_CLIENT_ID && process.env.SUPABASE_AUTH_LINKEDIN_SECRET),
      clientId: process.env.SUPABASE_AUTH_LINKEDIN_CLIENT_ID
    },
    facebook: {
      enabled: !!(process.env.SUPABASE_AUTH_FACEBOOK_CLIENT_ID && process.env.SUPABASE_AUTH_FACEBOOK_SECRET),
      clientId: process.env.SUPABASE_AUTH_FACEBOOK_CLIENT_ID
    }
  };

  return NextResponse.json(providers);
}
