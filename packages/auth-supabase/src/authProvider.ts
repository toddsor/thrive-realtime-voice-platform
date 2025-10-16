import { InjectableLogger } from "@thrivereflections/realtime-observability";

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
  signInWithOAuth?(provider: "google" | "linkedin" | "facebook"): Promise<void>;
}

export interface SupabaseAuthProviderConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  logger?: InjectableLogger;
}

export class SupabaseAuthProvider implements AuthProvider {
  private supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private config: SupabaseAuthProviderConfig;

  constructor(config: SupabaseAuthProviderConfig) {
    this.config = config;
    this.supabase = null;
  }

  setSupabaseClient(supabase: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    this.supabase = supabase;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.supabase) {
      this.config.logger?.debug("Supabase client not initialized, returning anonymous user");
      return {
        sub: "anonymous",
        tenant: "default",
      };
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user) {
        this.config.logger?.debug("No authenticated user found", { error: error?.message });
        return {
          sub: "anonymous",
          tenant: "default",
        };
      }

      const userData = {
        sub: user.id,
        tenant: "default",
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        provider: user.app_metadata?.provider,
      };

      this.config.logger?.info("User authenticated", {
        userId: userData.sub,
        email: userData.email,
        provider: userData.provider,
      });

      return userData;
    } catch (error) {
      this.config.logger?.error("Error getting current user", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        sub: "anonymous",
        tenant: "default",
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();
      const isAuth = !error && !!session;
      this.config.logger?.debug("Authentication check", { isAuthenticated: isAuth });
      return isAuth;
    } catch (error) {
      this.config.logger?.error("Error checking authentication", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.supabase) {
      const error = new Error("Supabase client not initialized");
      this.config.logger?.error("Sign in failed", { error: error.message });
      return { user: null, error };
    }

    try {
      this.config.logger?.info("Attempting email sign in", { email });

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.config.logger?.warn("Email sign in failed", {
          email,
          error: error.message,
        });
        return { user: null, error };
      }

      const user: User = {
        sub: data.user.id,
        tenant: "default",
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        provider: data.user.app_metadata?.provider,
      };

      this.config.logger?.info("Email sign in successful", {
        userId: user.sub,
        email: user.email,
      });

      return { user, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.config.logger?.error("Email sign in error", {
        email,
        error: errorMessage,
      });
      return { user: null, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.supabase) {
      const error = new Error("Supabase client not initialized");
      this.config.logger?.error("Sign up failed", { error: error.message });
      return { user: null, error };
    }

    try {
      this.config.logger?.info("Attempting user sign up", { email });

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        this.config.logger?.warn("User sign up failed", {
          email,
          error: error.message,
        });
        return { user: null, error };
      }

      if (!data.user) {
        const error = new Error("No user returned from signup");
        this.config.logger?.error("Sign up failed", {
          email,
          error: error.message,
        });
        return { user: null, error };
      }

      const user: User = {
        sub: data.user.id,
        tenant: "default",
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        provider: data.user.app_metadata?.provider,
      };

      this.config.logger?.info("User sign up successful", {
        userId: user.sub,
        email: user.email,
      });

      return { user, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.config.logger?.error("User sign up error", {
        email,
        error: errorMessage,
      });
      return { user: null, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  }

  async signInWithOAuth(provider: "google" | "linkedin" | "facebook"): Promise<void> {
    if (!this.supabase) {
      const error = new Error("Supabase client not initialized");
      this.config.logger?.error("OAuth sign in failed", {
        provider,
        error: error.message,
      });
      throw error;
    }

    try {
      this.config.logger?.info("Attempting OAuth sign in", { provider });

      // Force account selection by adding prompt=select_account
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        this.config.logger?.error("OAuth sign in failed", {
          provider,
          error: error.message,
        });
        throw error;
      }

      this.config.logger?.info("OAuth sign in initiated", { provider });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.config.logger?.error("OAuth sign in error", {
        provider,
        error: errorMessage,
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.supabase) {
      this.config.logger?.debug("Supabase client not initialized, skipping sign out");
      return;
    }

    try {
      this.config.logger?.info("Attempting sign out");

      const { error } = await this.supabase.auth.signOut();
      if (error) {
        this.config.logger?.error("Sign out failed", {
          error: error.message,
        });
      } else {
        this.config.logger?.info("Sign out successful");
      }
    } catch (error) {
      this.config.logger?.error("Sign out error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Legacy methods for compatibility
  async signIn(): Promise<User> {
    const user = await this.getCurrentUser();
    return user;
  }
}

export class AnonymousAuthProvider implements AuthProvider {
  private logger?: InjectableLogger;

  constructor(logger?: InjectableLogger) {
    this.logger = logger;
  }

  async getCurrentUser(): Promise<User> {
    this.logger?.debug("Returning anonymous user");
    return {
      sub: "anonymous",
      tenant: "default",
    };
  }

  async isAuthenticated(): Promise<boolean> {
    this.logger?.debug("Anonymous user is always authenticated");
    return true; // Anonymous is always "authenticated"
  }
}

// Factory function to create auth provider based on configuration
export function createAuthProvider(config: SupabaseAuthProviderConfig): AuthProvider {
  const authProvider = config.supabaseUrl && config.supabaseAnonKey ? "supabase" : "anonymous";

  switch (authProvider) {
    case "supabase":
      return new SupabaseAuthProvider(config);
    case "anonymous":
    default:
      return new AnonymousAuthProvider(config.logger);
  }
}
