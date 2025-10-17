# @thrivereflections/realtime-store-prisma

Prisma-based persistence store for the Thrive Realtime Voice Platform.

## Overview

This package provides a Prisma-based implementation of the `PersistenceStore` interface, enabling database persistence for voice sessions, transcripts, tool events, and summaries with consent management and PII redaction.

## Installation

```bash
npm install @thrivereflections/realtime-store-prisma
```

## Main Exports

- **`createPrismaStore(config, deps)`** - Create Prisma-based persistence store
- **`PrismaStoreConfig`** - Configuration interface
- **`PrismaStore`** - Store implementation class

## Usage Example

### Basic Setup

```typescript
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { redact } from "@thrivereflections/realtime-security";

const config = {
  databaseUrl: process.env.DATABASE_URL!,
  logLevel: "warn" as const,
};

const deps = {
  redact: redact, // PII redaction function
};

const store = createPrismaStore(config, deps);

// Use the store
await store.saveSessionMeta(sessionId, user, config, timings, "ACCEPTED");
```

### Session Management

```typescript
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";

const store = createPrismaStore(config, { redact });

// Save session metadata
await store.saveSessionMeta(
  "session-123",
  { id: "user-456", email: "user@example.com" },
  { voice: "alloy", persona: "Helpful assistant" },
  { startTime: new Date(), endTime: new Date() },
  "ACCEPTED" // User consent
);

// Append transcript
await store.appendTranscript("session-123", {
  role: "user",
  content: "Hello, how are you?",
  timestamp: new Date(),
});

// Append tool event
await store.appendToolEvent("session-123", {
  toolName: "echo",
  arguments: { message: "Hello" },
  result: "Hello",
  timestamp: new Date(),
});

// Persist summary
await store.persistSummary("session-123", {
  summary: "User asked about assistance",
  keyPoints: ["Greeting", "Question"],
  timestamp: new Date(),
});
```

## Configuration

### PrismaStoreConfig

```typescript
interface PrismaStoreConfig {
  databaseUrl: string; // PostgreSQL connection string
  logLevel?: "error" | "warn" | "info" | "query"; // Prisma log level
}
```

### Dependencies

```typescript
interface PrismaStoreDeps {
  redact: (text: string) => string; // PII redaction function
}
```

## Database Schema

The package includes a comprehensive Prisma schema with the following models:

### Core Tables

- **`AppUser`** - User accounts and authentication
- **`Session`** - Voice session metadata
- **`Transcript`** - Conversation transcripts
- **`ToolEvent`** - Tool call events and results
- **`Summary`** - Session summaries
- **`UsageEvent`** - Usage tracking and analytics

### Schema Example

```prisma
model AppUser {
  id        String   @id @default(cuid())
  email     String   @unique
  authId    String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions Session[]

  @@map("app_users")
}

model Session {
  id          String   @id @default(cuid())
  userId      String?
  user        AppUser? @relation(fields: [userId], references: [id])
  voice       String
  persona     String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transcripts Transcript[]
  toolEvents  ToolEvent[]
  summaries   Summary[]

  @@map("sessions")
}

model Transcript {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  role      String
  content   String
  timestamp DateTime @default(now())

  @@map("transcripts")
}
```

## Key Features

### Database Persistence

- **Session Storage** - Store voice session metadata
- **Transcript History** - Persist conversation transcripts
- **Tool Event Tracking** - Log function calls and results
- **Summary Storage** - Store session summaries

### Consent Management

- **User Consent** - Respect user consent before persisting data
- **Consent Levels** - `ACCEPTED`, `DECLINED`, `PENDING`
- **Default Behavior** - Defaults to `DECLINED` for new users

### PII Protection

- **Automatic Redaction** - Redact sensitive information before storage
- **Configurable Redaction** - Use custom redaction functions
- **Privacy by Design** - PII redaction applied to all text data

### Graceful Fallback

- **Database Unavailable** - Falls back to memory store when database is unavailable
- **Error Handling** - Comprehensive error handling and logging
- **Connection Pooling** - Efficient database connection management

## Database Setup

### 1. Install Prisma CLI

```bash
npm install -D prisma
```

### 2. Set up environment variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/voice_app"
DIRECT_URL="postgresql://user:password@localhost:5432/voice_app"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run migrations

```bash
npx prisma db push
# or
npx prisma migrate dev
```

## Store Methods

The store implements the `PersistenceStore` interface:

### Session Management

```typescript
// Save session metadata
await store.saveSessionMeta(
  sessionId: string,
  user: User,
  config: AgentConfig,
  timings: SessionTimings,
  consent: ConsentStatus
): Promise<void>

// Get session by ID
await store.getSession(sessionId: string): Promise<Session | null>
```

### Transcript Management

```typescript
// Append transcript segment
await store.appendTranscript(
  sessionId: string,
  segment: TranscriptSegment
): Promise<void>

// Get session transcripts
await store.getTranscripts(sessionId: string): Promise<TranscriptSegment[]>
```

### Tool Event Management

```typescript
// Append tool event
await store.appendToolEvent(
  sessionId: string,
  event: ToolEvent
): Promise<void>

// Get session tool events
await store.getToolEvents(sessionId: string): Promise<ToolEvent[]>
```

### Summary Management

```typescript
// Persist session summary
await store.persistSummary(
  sessionId: string,
  summary: SessionSummary
): Promise<void>

// Get session summary
await store.getSummary(sessionId: string): Promise<SessionSummary | null>
```

## Error Handling

The store includes comprehensive error handling:

- **Connection Failures** - Graceful fallback when database is unavailable
- **Validation Errors** - Date field validation and duplicate prevention
- **PII Redaction** - Automatic redaction of sensitive information
- **Logging** - Detailed logging for debugging and monitoring

## Development Scripts

```bash
# Build the package
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio
```

## Dependencies

- `@prisma/client` - Prisma database client
- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-security` - PII redaction utilities

## Related Documentation

- [Contracts](./contracts.md) - Store interface definitions
- [Security](./security.md) - PII redaction utilities
- [Package README](../../packages/store-prisma/README.md) - Detailed package documentation
