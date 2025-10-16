import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { InjectableLogger } from "@thrivereflections/realtime-observability";

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  logger?: InjectableLogger;
}

export interface SupabaseClientFactory {
  createBrowserClient(): SupabaseClient | null;
  createServerClient(cookies: any): Promise<SupabaseClient>;
  createMiddlewareClient(request: any): { supabase: SupabaseClient; response: any };
}

export class SupabaseClientFactoryImpl implements SupabaseClientFactory {
  private config: SupabaseClientConfig;

  constructor(config: SupabaseClientConfig) {
    this.config = config;
  }

  createBrowserClient(): SupabaseClient | null {
    const { supabaseUrl, supabaseAnonKey } = this.config;

    if (!supabaseUrl || !supabaseAnonKey) {
      this.config.logger?.warn("Supabase configuration missing, returning null client");
      return null;
    }

    try {
      const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
      this.config.logger?.debug("Browser Supabase client created");
      return client;
    } catch (error) {
      this.config.logger?.error("Failed to create browser Supabase client", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async createServerClient(cookies: any): Promise<SupabaseClient> {
    const { supabaseUrl, supabaseAnonKey } = this.config;

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error(
        "Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
      );
      this.config.logger?.error("Server Supabase client creation failed", { error: error.message });
      throw error;
    }

    try {
      const client = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookies.set(name, value, options));
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      });

      this.config.logger?.debug("Server Supabase client created");
      return client;
    } catch (error) {
      this.config.logger?.error("Failed to create server Supabase client", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  createMiddlewareClient(request: any): { supabase: SupabaseClient; response: any } {
    const { supabaseUrl, supabaseAnonKey } = this.config;

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error(
        "Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
      );
      this.config.logger?.error("Middleware Supabase client creation failed", { error: error.message });
      throw error;
    }

    try {
      let response = request.next({
        request: {
          headers: request.headers,
        },
      });

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = request.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });

      this.config.logger?.debug("Middleware Supabase client created");
      return { supabase, response };
    } catch (error) {
      this.config.logger?.error("Failed to create middleware Supabase client", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

// Factory function to create Supabase client factory
export function createSupabaseClientFactory(config: SupabaseClientConfig): SupabaseClientFactory {
  return new SupabaseClientFactoryImpl(config);
}
