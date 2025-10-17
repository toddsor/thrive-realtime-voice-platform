import { NextResponse } from 'next/server';
import { loadAuthConfig } from '@thrivereflections/realtime-config';

export async function GET() {
  const authConfig = loadAuthConfig();
  
  // Check which OAuth providers are configured
  const providers = {
    google: {
      enabled: !!authConfig.supabase?.providers?.google,
      clientId: authConfig.supabase?.providers?.google?.clientId
    },
    linkedin: {
      enabled: !!authConfig.supabase?.providers?.linkedin,
      clientId: authConfig.supabase?.providers?.linkedin?.clientId
    },
    facebook: {
      enabled: !!authConfig.supabase?.providers?.facebook,
      clientId: authConfig.supabase?.providers?.facebook?.clientId
    }
  };

  return NextResponse.json(providers);
}
