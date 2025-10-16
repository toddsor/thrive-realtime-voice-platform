import { InjectableLogger } from "@thrivereflections/realtime-observability";
import { User } from "./authProvider";

export interface UserSyncConfig {
  logger?: InjectableLogger;
}

export interface UserSyncStore {
  findUserByAuthId(authUserId: string): Promise<AppUser | null>;
  createUser(userData: CreateUserData): Promise<AppUser>;
  updateUser(authUserId: string, userData: UpdateUserData): Promise<AppUser>;
}

export interface AppUser {
  id: string;
  authUserId: string;
  email?: string;
  name?: string;
  provider?: string;
  plan: string;
  consent: "ACCEPTED" | "DECLINED";
  lastSignInAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  authUserId: string;
  email?: string;
  name?: string;
  provider?: string;
  plan?: string;
  consent?: "ACCEPTED" | "DECLINED";
  lastSignInAt: Date;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  provider?: string;
  lastSignInAt: Date;
}

export class UserSyncService {
  private store: UserSyncStore;
  private config: UserSyncConfig;

  constructor(store: UserSyncStore, config: UserSyncConfig = {}) {
    this.store = store;
    this.config = config;
  }

  async syncUserToAppUser(supabaseUser: {
    id: string;
    email?: string;
    user_metadata?: any;
    app_metadata?: any;
  }): Promise<User | null> {
    try {
      if (!supabaseUser?.id) {
        this.config.logger?.error("No user ID provided for sync");
        return null;
      }

      this.config.logger?.info("Starting user sync", {
        userId: supabaseUser.id,
        email: supabaseUser.email,
      });

      const userData = {
        authUserId: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
        provider: supabaseUser.app_metadata?.provider || "email",
        lastSignInAt: new Date(),
      };

      // Try to find existing user
      const existingUser = await this.store.findUserByAuthId(supabaseUser.id);

      let appUser: AppUser;
      if (existingUser) {
        // Update existing user
        this.config.logger?.info("Updating existing user", {
          userId: supabaseUser.id,
          email: supabaseUser.email,
        });

        appUser = await this.store.updateUser(supabaseUser.id, {
          email: userData.email,
          name: userData.name,
          provider: userData.provider,
          lastSignInAt: userData.lastSignInAt,
        });
      } else {
        // Create new user
        this.config.logger?.info("Creating new user", {
          userId: supabaseUser.id,
          email: supabaseUser.email,
        });

        appUser = await this.store.createUser({
          ...userData,
          plan: "FREE",
          consent: "DECLINED",
        });
      }

      // Return User object in expected format
      const user: User = {
        sub: appUser.authUserId,
        tenant: "default",
        email: appUser.email || undefined,
        name: appUser.name || undefined,
        provider: appUser.provider || undefined,
      };

      this.config.logger?.info("User sync completed successfully", {
        userId: user.sub,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.config.logger?.error("Error syncing user to AppUser", {
        userId: supabaseUser.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async getUserByAuthId(authUserId: string): Promise<User | null> {
    try {
      this.config.logger?.debug("Looking up user by auth ID", { authUserId });

      const appUser = await this.store.findUserByAuthId(authUserId);

      if (!appUser) {
        this.config.logger?.debug("User not found", { authUserId });
        return null;
      }

      const user: User = {
        sub: appUser.authUserId,
        tenant: "default",
        email: appUser.email || undefined,
        name: appUser.name || undefined,
        provider: appUser.provider || undefined,
      };

      this.config.logger?.debug("User found", {
        userId: user.sub,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.config.logger?.error("Error getting user by auth ID", {
        authUserId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }
}

// Factory function to create user sync service
export function createUserSyncService(store: UserSyncStore, config?: UserSyncConfig): UserSyncService {
  return new UserSyncService(store, config);
}
