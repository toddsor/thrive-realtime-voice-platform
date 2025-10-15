import { prisma } from "@thrive/realtime-lib";
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

    if (!prisma) {
      console.log("Database not available, skipping user sync");
      return null;
    }

    const userData = {
      sub: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      provider: supabaseUser.app_metadata?.provider || "email",
      lastSignInAt: new Date(),
    };

    // Try to find existing user
    const existingUser = await prisma.appUser.findUnique({
      where: { sub: supabaseUser.id },
    });

    let appUser;
    if (existingUser) {
      // Update existing user
      appUser = await prisma.appUser.update({
        where: { sub: supabaseUser.id },
        data: {
          email: userData.email,
          name: userData.name,
          provider: userData.provider,
          lastSignInAt: userData.lastSignInAt,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new user
      appUser = await prisma.appUser.create({
        data: userData,
      });
    }

    // Return User object in expected format
    return {
      sub: appUser.sub,
      tenant: appUser.tenant,
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
    if (!prisma) {
      console.log("Database not available, skipping user lookup");
      return null;
    }

    const appUser = await prisma.appUser.findUnique({
      where: { sub: authUserId },
    });

    if (!appUser) {
      return null;
    }

    return {
      sub: appUser.sub,
      tenant: appUser.tenant,
      email: appUser.email || undefined,
      name: appUser.name || undefined,
      provider: appUser.provider || undefined,
    };
  } catch (error) {
    console.error("Error getting user by auth ID:", error);
    return null;
  }
}
