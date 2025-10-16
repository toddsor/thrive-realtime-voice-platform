# Multi-App Schema Extension Pattern

## Overview

The platform supports creating multiple independent applications, each with its own database schema extensions. This pattern allows different use cases to evolve independently.

## Pattern Description

Each application maintains its own complete Prisma schema that includes:

1. **Base Platform Schema** - Core tables from `packages/store-prisma`
2. **App-Specific Extensions** - Tables unique to that application
3. **Relations** - Links between base and extension tables

## Why This Pattern?

- ✅ Each app can extend the base schema independently
- ✅ Full type safety with proper relations
- ✅ Apps can evolve without affecting others
- ✅ Single Prisma client per app (simpler)
- ✅ Apps can have different database instances

## Implementation

See `apps/demo-voice/lib/README.md` for a complete example.

### Creating a New Application

1. Copy base schema from `packages/store-prisma/prisma/schema.prisma`
2. Add your app-specific tables and enums
3. Create relations between base and extension tables
4. Run `prisma generate` and `prisma db push`

### Schema Maintenance

When the platform base schema changes:

1. Review changes in `packages/store-prisma/prisma/schema.prisma`
2. Update your app's schema to include the changes
3. Run `prisma db push` to sync the database
4. Update any affected code

This manual sync allows each app to adopt base schema changes on its own timeline.
