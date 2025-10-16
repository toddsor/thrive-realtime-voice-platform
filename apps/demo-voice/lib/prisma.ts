import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const hasDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "";

export const prisma = hasDatabase
  ? globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    })
  : null;

if (process.env.NODE_ENV !== "production" && hasDatabase && prisma) {
  globalForPrisma.prisma = prisma;
}
