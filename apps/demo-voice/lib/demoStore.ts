import { PrismaClient } from "../node_modules/.prisma/client";
import { createPrismaStore, PrismaStoreConfig, PrismaStoreDeps } from "@thrivereflections/realtime-store-prisma";
import { PersistenceStore } from "@thrivereflections/realtime-contracts";

// Demo-specific interfaces
export interface DemoSession {
  id: string;
  userId: string;
  sessionName: string;
  demoType: "VOICE" | "CHAT" | "VIDEO";
  metadata?: any;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  feedback: DemoFeedback[];
}

export interface DemoFeedback {
  id: string;
  sessionId: string;
  userId: string;
  rating: number;
  feedback?: string | null;
  category: string;
  createdAt: Date;
}

export interface DemoStoreConfig extends PrismaStoreConfig {
  // Additional demo-specific config if needed
}

export interface DemoStoreDeps extends PrismaStoreDeps {
  // Additional demo-specific dependencies if needed
}

// Extended store interface that includes demo-specific methods
export interface DemoStore extends PersistenceStore {
  // Demo session management
  createDemoSession(data: {
    userId: string;
    sessionName: string;
    demoType: "VOICE" | "CHAT" | "VIDEO";
    metadata?: any;
  }): Promise<DemoSession>;

  getDemoSessions(userId?: string): Promise<DemoSession[]>;

  updateDemoSession(id: string, data: Partial<DemoSession>): Promise<DemoSession>;

  // Demo feedback management
  createDemoFeedback(data: {
    sessionId: string;
    userId: string;
    rating: number;
    feedback?: string;
    category: string;
  }): Promise<DemoFeedback>;

  getDemoFeedback(sessionId?: string, userId?: string): Promise<DemoFeedback[]>;

  // User management
  createOrUpdateUser(data: {
    authUserId: string;
    email?: string;
    name?: string;
    provider?: string;
  }): Promise<{
    id: string;
    authUserId: string;
    email?: string | null;
    name?: string | null;
    provider?: string | null;
  }>;

  getUserByAuthId(
    authUserId: string
  ): Promise<{
    id: string;
    authUserId: string;
    email?: string | null;
    name?: string | null;
    provider?: string | null;
  } | null>;
}

export function createDemoStore(config: DemoStoreConfig, deps: DemoStoreDeps): DemoStore {
  const baseStore = createPrismaStore(config, deps);

  // Create Prisma client for demo-specific operations
  const hasDatabase = config.databaseUrl && config.databaseUrl.trim() !== "";
  const prisma = hasDatabase
    ? new PrismaClient({
        log: config.logLevel ? [config.logLevel] : ["error"],
      })
    : null;

  return {
    // Delegate core platform methods to base store
    ...baseStore,

    // Demo-specific implementations
    async createDemoSession(data) {
      if (!prisma) {
        throw new Error("Database not available");
      }

      return (await prisma.demoSession.create({
        data: {
          userId: data.userId,
          sessionName: data.sessionName,
          demoType: data.demoType,
          metadata: data.metadata,
          status: "ACTIVE",
        },
        include: {
          feedback: true,
        },
      })) as DemoSession;
    },

    async getDemoSessions(userId) {
      if (!prisma) {
        return [];
      }

      return (await prisma.demoSession.findMany({
        where: userId ? { userId } : {},
        include: {
          feedback: true,
        },
        orderBy: { createdAt: "desc" },
      })) as DemoSession[];
    },

    async updateDemoSession(id, data) {
      if (!prisma) {
        throw new Error("Database not available");
      }

      // Filter out fields that shouldn't be updated
      const { id: _, createdAt, feedback, ...updateData } = data;

      return (await prisma.demoSession.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          feedback: true,
        },
      })) as DemoSession;
    },

    async createDemoFeedback(data) {
      if (!prisma) {
        throw new Error("Database not available");
      }

      return await prisma.demoFeedback.create({
        data: {
          sessionId: data.sessionId,
          userId: data.userId,
          rating: data.rating,
          feedback: data.feedback,
          category: data.category,
        },
      });
    },

    async getDemoFeedback(sessionId, userId) {
      if (!prisma) {
        return [];
      }

      const where: any = {};
      if (sessionId) where.sessionId = sessionId;
      if (userId) where.userId = userId;

      return await prisma.demoFeedback.findMany({
        where,
        include: {
          session: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async createOrUpdateUser(data) {
      if (!prisma) {
        throw new Error("Database not available");
      }

      // Try to find existing user
      const existingUser = await prisma.appUser.findUnique({
        where: { authUserId: data.authUserId },
      });

      if (existingUser) {
        // Update existing user
        return await prisma.appUser.update({
          where: { authUserId: data.authUserId },
          data: {
            email: data.email,
            name: data.name,
            provider: data.provider,
            lastSignInAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new user
        return await prisma.appUser.create({
          data: {
            authUserId: data.authUserId,
            email: data.email,
            name: data.name,
            provider: data.provider,
            lastSignInAt: new Date(),
          },
        });
      }
    },

    async getUserByAuthId(authUserId) {
      if (!prisma) {
        return null;
      }

      return await prisma.appUser.findUnique({
        where: { authUserId },
      });
    },
  };
}
