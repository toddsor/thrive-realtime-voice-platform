# @thrive/realtime-store-prisma

Prisma-based persistence store for the Thrive Realtime Voice Platform.

## Overview

This package provides a Prisma-based implementation of the `PersistenceStore` interface, enabling database persistence for voice sessions, transcripts, tool events, and summaries.

## Features

- **Database Persistence**: Store sessions, transcripts, tool events, and summaries
- **Consent Management**: Respect user consent before persisting data
- **PII Redaction**: Redact sensitive information before storage
- **Graceful Fallback**: Falls back to memory store when database is unavailable
- **Type Safety**: Full TypeScript support with Prisma-generated types

## Installation

```bash
pnpm add @thrive/realtime-store-prisma
```

## Usage

### Basic Setup

```typescript
import { createPrismaStore } from "@thrive/realtime-store-prisma";
import { redact } from "@thrive/realtime-security";

const config = {
  databaseUrl: process.env.DATABASE_URL!,
  logLevel: "warn" as const
};

const deps = {
  redact: redact
};

const store = createPrismaStore(config, deps);
```

### Database Setup

1. **Install Prisma CLI**:
   ```bash
   pnpm add -D prisma
   ```

2. **Set up environment variables**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/voice_app"
   DIRECT_URL="postgresql://user:password@localhost:5432/voice_app"
   ```

3. **Generate Prisma client**:
   ```bash
   pnpm db:generate
   ```

4. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```

### Configuration

The store accepts the following configuration:

```typescript
interface PrismaStoreConfig {
  databaseUrl: string;           // PostgreSQL connection string
  logLevel?: "error" | "warn" | "info" | "query"; // Prisma log level
}
```

### Dependencies

The store requires a PII redaction function:

```typescript
interface PrismaStoreDeps {
  redact: (text: string) => string; // Function to redact PII
}
```

## API Reference

### `createPrismaStore(config, deps)`

Creates a Prisma-based persistence store.

**Parameters:**
- `config`: Database configuration
- `deps`: Required dependencies (redaction function)

**Returns:** `PersistenceStore` implementation

### Store Methods

The store implements the `PersistenceStore` interface:

- `saveSessionMeta(sessionId, user, config, timings, consent)`: Save session metadata
- `appendTranscript(sessionId, segment)`: Append transcript segment
- `appendToolEvent(sessionId, event)`: Append tool event
- `persistSummary(sessionId, summary)`: Persist session summary

## Database Schema

The package includes a Prisma schema with the following models:

- **AppUser**: User accounts and authentication
- **Session**: Voice session metadata
- **Transcript**: Conversation transcripts
- **ToolEvent**: Tool call events and results
- **Summary**: Session summaries
- **UsageEvent**: Usage tracking and analytics

## Consent Management

The store respects user consent settings:

- Only persists data when `consent === "ACCEPTED"`
- Skips persistence when consent is declined
- Defaults to `DECLINED` for new users

## PII Protection

All text data is redacted before storage:

- Phone numbers, emails, addresses are masked
- Sensitive information is replaced with placeholders
- Redaction is applied to transcripts and summaries

## Error Handling

The store includes comprehensive error handling:

- Graceful fallback when database is unavailable
- Validation of date fields
- Duplicate prevention for sessions
- Detailed logging for debugging

## Development

### Scripts

- `pnpm build`: Build the package
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm lint`: Run ESLint
- `pnpm db:generate`: Generate Prisma client
- `pnpm db:push`: Push schema to database
- `pnpm db:migrate`: Run database migrations
- `pnpm db:studio`: Open Prisma Studio

### Testing

```bash
# Run tests
pnpm test

# Run tests with database
DATABASE_URL="postgresql://..." pnpm test
```

## Dependencies

- `@prisma/client`: Prisma database client
- `@thrive/realtime-contracts`: Shared type definitions

## License

MIT
