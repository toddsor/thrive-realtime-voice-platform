import { demoStore } from "@/lib/store";
import { User } from "./authProvider";

export async function syncUserToAppUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}): Promise<User | null> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    if (!supabaseUser?.id) {
      console.error("No user ID provided for sync");
      return null;
    }

    const userData = {
      authUserId: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      provider: supabaseUser.app_metadata?.provider || "email",
    };

    // Use the platform's store adapter
    const appUser = await demoStore.createOrUpdateUser(userData);

    // Return User object in expected format
    return {
      sub: appUser.authUserId,
      tenant: appUser.id, // Use id as tenant
      email: appUser.email || undefined,
      name: appUser.name || undefined,
      provider: appUser.provider || undefined,
    };
  } catch (error) {
    console.error("Error syncing user to AppUser:", error);
    return null;
  }
}

export async function getUserByAuthId(authUserId: string): Promise<User | null> {
  try {
    const appUser = await demoStore.getUserByAuthId(authUserId);

    if (!appUser) {
      return null;
    }

    return {
      sub: appUser.authUserId,
      tenant: appUser.id, // Use id as tenant
      email: appUser.email || undefined,
      name: appUser.name || undefined,
      provider: appUser.provider || undefined,
    };
  } catch (error) {
    console.error("Error getting user by auth ID:", error);
    return null;
  }
}
