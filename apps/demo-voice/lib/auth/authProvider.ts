export interface User {
  sub: string;
  tenant?: string;
  email?: string;
  name?: string;
  provider?: string;
}

export interface AuthProvider {
  getCurrentUser(): Promise<User>;
  isAuthenticated(): Promise<boolean>;
  signIn?(): Promise<User>;
  signOut?(): Promise<void>;
  signUp?(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signInWithEmail?(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signInWithOAuth?(provider: 'google' | 'linkedin' | 'facebook'): Promise<void>;
}

export class SupabaseAuthProvider implements AuthProvider {
  private supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    // This will be set by the client-side code
    this.supabase = null;
  }

  setSupabaseClient(supabase: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.supabase = supabase;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.supabase) {
      return {
        sub: 'anonymous',
        tenant: 'default'
      };
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return {
          sub: 'anonymous',
          tenant: 'default'
        };
      }

      return {
        sub: user.id,
        tenant: 'default',
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        provider: user.app_metadata?.provider
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        sub: 'anonymous',
        tenant: 'default'
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      return !error && !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.supabase) {
      return { user: null, error: new Error('Supabase client not initialized') };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      const user: User = {
        sub: data.user.id,
        tenant: 'default',
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        provider: data.user.app_metadata?.provider
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.supabase) {
      return { user: null, error: new Error('Supabase client not initialized') };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (!data.user) {
        return { user: null, error: new Error('No user returned from signup') };
      }

      const user: User = {
        sub: data.user.id,
        tenant: 'default',
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        provider: data.user.app_metadata?.provider
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signInWithOAuth(provider: 'google' | 'linkedin' | 'facebook'): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Force account selection by adding prompt=select_account
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Legacy methods for compatibility
  async signIn(): Promise<User> {
    const user = await this.getCurrentUser();
    return user;
  }
}

export class AnonymousAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<User> {
    return {
      sub: 'anonymous',
      tenant: 'default'
    };
  }

  async isAuthenticated(): Promise<boolean> {
    return true; // Anonymous is always "authenticated"
  }
}

// Factory function to create auth provider based on environment
export function createAuthProvider(): AuthProvider {
  const authProvider = process.env.AUTH_PROVIDER || 'supabase';
  
  switch (authProvider) {
    case 'supabase':
      return new SupabaseAuthProvider();
    case 'anonymous':
    default:
      return new AnonymousAuthProvider();
  }
}

// Singleton instance
export const authProvider = createAuthProvider();
