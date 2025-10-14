// Auth provider interfaces and implementations
export { SupabaseAuthProvider, AnonymousAuthProvider, createAuthProvider } from "./authProvider";
export type { User, AuthProvider, SupabaseAuthProviderConfig } from "./authProvider";

// User sync service
export { UserSyncService, createUserSyncService } from "./userSync";
export type { UserSyncConfig, UserSyncStore, AppUser, CreateUserData, UpdateUserData } from "./userSync";

// Supabase client factory
export { SupabaseClientFactoryImpl, createSupabaseClientFactory } from "./supabaseClient";
export type { SupabaseClientConfig, SupabaseClientFactory } from "./supabaseClient";
