# Multi-App Schema Extension Pattern

## Architecture

This project uses a **combined schema pattern** where each application maintains its own complete Prisma schema that includes:

1. **Base Platform Schema** - Core tables copied from `packages/store-prisma`
2. **App-Specific Extensions** - Tables unique to this application
3. **Relations** - Links between base and extension tables

## Why This Pattern?

- ✅ Each app can extend the base schema independently
- ✅ Full type safety with proper relations between all tables
- ✅ Apps can evolve their schemas without affecting others
- ✅ Single Prisma client per app (simpler development)
- ✅ Apps can have different database instances if needed

## Creating a New Application

1. Copy the base schema from `packages/store-prisma/prisma/schema.prisma`
2. Add your app-specific tables and enums
3. Create relations between base and extension tables as needed
4. Run `prisma generate` and `prisma db push`

## Development Workflow

```bash
# Start development with fresh schema
npm run dev:full

# Or manually:
npm run db:generate  # Generate Prisma client
npm run db:push      # Sync schema to database
npm run dev          # Start dev server
```

## Schema Maintenance

When the platform base schema changes:

1. Review changes in `packages/store-prisma/prisma/schema.prisma`
2. Update your app's schema file to include the changes
3. Run `prisma db push` to sync the database
4. Update any affected code

This manual sync allows each app to adopt base schema changes on its own timeline.

## Demo App Implementation

This demo app demonstrates the pattern with:

### Demo-Specific Models

- **DemoSession**: Tracks demo sessions with metadata and status
- **DemoFeedback**: Collects user feedback on demo sessions
- **DemoType/Status Enums**: Categorize demo sessions

### Relations

- `DemoSession.user` → `AppUser` (many-to-one)
- `DemoFeedback.session` → `DemoSession` (many-to-one)
- `AppUser.demoSessions` → `DemoSession[]` (one-to-many)

### Usage Examples

```typescript
import { prisma } from "@/lib/prisma";

// Create a demo session with user relation
const session = await prisma.demoSession.create({
  data: {
    userId: "user-123",
    sessionName: "Voice Demo",
    demoType: "VOICE",
    metadata: { source: "website" }
  },
  include: {
    user: true,  // Includes AppUser data
    feedback: true
  }
});

// Get analytics with relations
const analytics = await prisma.demoSession.findMany({
  include: {
    user: true,
    feedback: true
  }
});
```

## API Routes

- `POST /api/demo/sessions` - Create demo session
- `GET /api/demo/sessions?userId=xxx` - Get user's demo sessions
- `POST /api/demo/feedback` - Submit feedback
- `GET /api/demo/analytics?userId=xxx` - Get analytics

## Benefits of This Approach

1. **Independence**: Each app has complete control over its schema
2. **Type Safety**: Full TypeScript support with proper relations
3. **Simplicity**: One Prisma client per app, no wrapper layers needed
4. **Flexibility**: Apps can extend differently for different use cases
5. **No Duplication in Runtime**: Each app only includes what it needs

## Trade-offs

- ✅ Schema duplication in source (acceptable for independent apps)
- ✅ Manual sync of base schema changes (gives apps control over when to adopt changes)
- ✅ Each app maintains its own database migrations

This pattern prioritizes **application independence** over **schema reuse**, which is appropriate for a platform with multiple distinct use cases.