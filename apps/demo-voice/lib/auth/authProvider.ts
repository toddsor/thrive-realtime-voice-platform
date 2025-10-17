import { createClient } from "@/lib/supabase/client";
import { SupabaseAuthProvider as PlatformSupabaseAuthProvider } from "@thrivereflections/realtime-auth-supabase";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";
import { syncUserToAppUser, getUserByAuthId } from "./userSync";

export interface User {
  sub: string;
  tenant: string;
  email?: string;
  name?: string;
  provider?: string;
}

// Create logger for auth operations
const logger = new InjectableConsoleLogger("auth-provider");

// Create Supabase client
const supabaseClient = createClient();

// Create auth provider instance
export const SupabaseAuthProvider = new PlatformSupabaseAuthProvider({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  logger,
});

// Enhanced auth provider with user sync
export class DemoAuthProvider {
  private supabaseAuth: typeof SupabaseAuthProvider;

  constructor() {
    this.supabaseAuth = SupabaseAuthProvider;
  }

  async signInWithOAuth(provider: "google" | "github" | "discord") {
    if (!supabaseClient) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/demo`,
      },
    });

    if (error) {
      logger.error("OAuth sign-in failed", { error: error.message, provider });
      throw error;
    }

    return data;
  }

  async signOut() {
    if (!supabaseClient) {
      throw new Error("Supabase client not available");
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      logger.error("Sign out failed", { error: error.message });
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (!supabaseClient) {
        logger.error("Supabase client not available");
        return null;
      }

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) {
        logger.error("Failed to get current user", { error: error.message });
        return null;
      }

      if (!user) {
        return null;
      }

      // Sync user to app user
      const syncedUser = await syncUserToAppUser(user);
      return syncedUser;
    } catch (error) {
      logger.error("Error getting current user", { error });
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      if (!supabaseClient) {
        logger.warn("Supabase client not available");
        return false;
      }

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) {
        logger.warn("Auth check failed", { error: error.message });
        return false;
      }

      return !!user;
    } catch (error) {
      logger.error("Error checking authentication", { error });
      return false;
    }
  }

  // Get user by auth ID (for server-side use)
  async getUserByAuthId(authId: string): Promise<User | null> {
    try {
      return await getUserByAuthId(authId);
    } catch (error) {
      logger.error("Error getting user by auth ID", { error, authId });
      return null;
    }
  }

  // Get the underlying Supabase auth provider for direct access
  getSupabaseAuth() {
    return this.supabaseAuth;
  }
}

// Export singleton instance
export const authProvider = new DemoAuthProvider();
