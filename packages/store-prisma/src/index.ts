import { PrismaClient } from "@prisma/client/edge";
import {
  PersistenceStore,
  Consent,
  UserRef,
  Timings,
  TranscriptSegment,
  ToolEvent,
} from "@thrivereflections/realtime-contracts";
import { AgentConfig } from "@thrivereflections/realtime-contracts";

export interface PrismaStoreConfig {
  databaseUrl: string;
  logLevel?: "error" | "warn" | "info" | "query";
}

export interface PrismaStoreDeps {
  redact: (text: string) => string;
}

const globalForPrismaEdge = globalThis as unknown as {
  prismaEdge: ReturnType<typeof createPrismaEdge> | undefined;
};

function createPrismaEdge(config: PrismaStoreConfig) {
  const client = new PrismaClient({
    log: config.logLevel ? [config.logLevel] : ["error"],
  });

  // Note: Accelerate extension requires prisma:// URLs, not postgresql://
  // For now, use regular Edge client without Accelerate
  return client;
}

export function createPrismaStore(config: PrismaStoreConfig, deps: PrismaStoreDeps): PersistenceStore {
  const hasDatabase = config.databaseUrl && config.databaseUrl.trim() !== "";
  
  if (!hasDatabase) {
    console.log("Database not available, skipping Prisma store creation");
    return createMemoryStore();
  }

  const prismaEdge = globalForPrismaEdge.prismaEdge ?? createPrismaEdge(config);
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrismaEdge.prismaEdge = prismaEdge;
  }

  return {
    async saveSessionMeta(
      id: string,
      user: UserRef | null,
      config: AgentConfig,
      timings: Timings,
      consent: Consent
    ): Promise<void> {
      if (!hasDatabase || !prismaEdge) {
        console.log("Database not available, skipping session metadata save");
        return;
      }

      // Check if session already exists to prevent duplicate creation
      const existingSession = await prismaEdge.session.findUnique({
        where: { id },
        select: { id: true },
      });

      if (existingSession) {
        console.log(`Session ${id} already exists, skipping creation`);
        return;
      }

      // For now, set userId to null since we don't have authentication set up
      // TODO: When auth is implemented, create or find the AppUser record first
      await prismaEdge.session.create({
        data: {
          id,
          userId: null, // Always null until auth is implemented
          openAiSession: timings.providerSessionId,
          skill: config.persona || "default",
          configJson: config as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          timingsJson: timings as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          consent,
        },
      });
    },

    async appendTranscript(sessionId: string, seg: TranscriptSegment): Promise<void> {
      if (!hasDatabase || !prismaEdge) {
        console.log("Database not available, skipping transcript append");
        return;
      }

      // Check consent before persisting
      const session = await prismaEdge.session.findUnique({
        where: { id: sessionId },
        select: { consent: true },
      });

      if (session?.consent !== "ACCEPTED") {
        return; // Skip persistence if consent declined
      }

      const text = deps.redact(seg.text);

      // Handle date conversion safely
      const startedAt = seg.startedAt ? new Date(seg.startedAt) : new Date();
      const endedAt = seg.endedAt ? new Date(seg.endedAt) : new Date();

      // Validate dates
      if (isNaN(startedAt.getTime())) {
        console.warn(`Invalid startedAt date for transcript: ${seg.startedAt}, using current time`);
        startedAt.setTime(Date.now());
      }
      if (isNaN(endedAt.getTime())) {
        console.warn(`Invalid endedAt date for transcript: ${seg.endedAt}, using current time`);
        endedAt.setTime(Date.now());
      }

      await prismaEdge.transcript.create({
        data: {
          sessionId,
          role: seg.role,
          text,
          startedAt,
          endedAt,
        },
      });
    },

    async appendToolEvent(sessionId: string, e: ToolEvent): Promise<void> {
      if (!hasDatabase || !prismaEdge) {
        console.log("Database not available, skipping tool event append");
        return;
      }

      const session = await prismaEdge.session.findUnique({
        where: { id: sessionId },
        select: { consent: true },
      });

      if (session?.consent !== "ACCEPTED") {
        return;
      }

      await prismaEdge.toolEvent.create({
        data: {
          sessionId,
          name: e.name,
          argsJson: e.args as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          resultJson: (e.result as any) ?? null, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      });
    },

    async persistSummary(sessionId: string, text: string): Promise<void> {
      if (!hasDatabase || !prismaEdge) {
        console.log("Database not available, skipping summary persist");
        return;
      }

      const session = await prismaEdge.session.findUnique({
        where: { id: sessionId },
        select: { consent: true },
      });

      if (session?.consent !== "ACCEPTED") {
        return;
      }

      const cleaned = deps.redact(text);
      await prismaEdge.summary.create({
        data: { sessionId, text: cleaned },
      });
    },
  };
}

// Simple in-memory store for when database is not available
function createMemoryStore(): PersistenceStore {
  return {
    async saveSessionMeta(): Promise<void> {
      console.log("Memory store: saveSessionMeta called");
    },
    async appendTranscript(): Promise<void> {
      console.log("Memory store: appendTranscript called");
    },
    async appendToolEvent(): Promise<void> {
      console.log("Memory store: appendToolEvent called");
    },
    async persistSummary(): Promise<void> {
      console.log("Memory store: persistSummary called");
    },
  };
}
