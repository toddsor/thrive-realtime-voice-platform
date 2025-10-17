# @thrivereflections/realtime-auth-supabase

Supabase authentication provider for the Thrive Realtime Voice Platform.

## Overview

This package provides a complete authentication solution using Supabase Auth with multi-provider support (Google, LinkedIn, Facebook, email/password). It includes user synchronization, session management, and client utilities for Next.js applications.

## Installation

```bash
npm install @thrivereflections/realtime-auth-supabase
```

## Main Exports

### Auth Provider

- **`createAuthProvider(config)`** - Create authentication provider
- **`AuthProvider`** - Authentication provider interface

### Supabase Client Factory

- **`createSupabaseClientFactory(config)`** - Create Supabase client factory
- **`SupabaseClientFactory`** - Client factory interface

### User Synchronization

- **`createUserSyncService(store, config)`** - Create user sync service
- **`UserSyncService`** - User synchronization interface

### Client Utilities

- **`createBrowserClient()`** - Create browser client
- **`createServerClient(cookies)`** - Create server client
- **`createMiddlewareClient(request)`** - Create middleware client

## Usage Example

### Basic Setup

```typescript
import {
  createAuthProvider,
  createSupabaseClientFactory,
  createUserSyncService,
} from "@thrivereflections/realtime-auth-supabase";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

// Create logger
const logger = new InjectableConsoleLogger();

// Create Supabase client factory
const supabaseFactory = createSupabaseClientFactory({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  logger,
});

// Create auth provider
const authProvider = createAuthProvider({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  logger,
});

// Set up Supabase client
const supabase = supabaseFactory.createBrowserClient();
if (supabase) {
  authProvider.setSupabaseClient(supabase);
}
```

### Authentication Methods

```typescript
import { createAuthProvider } from "@thrivereflections/realtime-auth-supabase";

const authProvider = createAuthProvider(config);

// Email/password authentication
const { user, error } = await authProvider.signInWithEmail("user@example.com", "password123");

if (error) {
  console.error("Sign in failed:", error.message);
} else {
  console.log("User signed in:", user);
}

// OAuth authentication
await authProvider.signInWithOAuth("google");
await authProvider.signInWithOAuth("linkedin");
await authProvider.signInWithOAuth("facebook");

// Sign up
const { user, error } = await authProvider.signUp("newuser@example.com", "password123");

// Sign out
await authProvider.signOut();

// Check authentication status
const isAuthenticated = await authProvider.isAuthenticated();
const currentUser = await authProvider.getCurrentUser();
```

### User Synchronization

```typescript
import { createUserSyncService } from "@thrivereflections/realtime-auth-supabase";
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";

// Create user sync service with your database store
const userSync = createUserSyncService(yourDatabaseStore, { logger });

// Sync Supabase user to your database
const user = await userSync.syncUserToAppUser(supabaseUser);
console.log(user);
// {
//   id: "user-123",
//   email: "user@example.com",
//   authId: "auth-456",
//   createdAt: Date,
//   updatedAt: Date
// }

// Get user by auth ID
const existingUser = await userSync.getUserByAuthId("auth-456");
```

### Next.js Integration

#### Browser Client

```typescript
// lib/supabase/client.ts
import { createSupabaseClientFactory } from "@thrivereflections/realtime-auth-supabase";

const supabaseFactory = createSupabaseClientFactory({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export function createClient() {
  return supabaseFactory.createBrowserClient();
}
```

#### Server Client

```typescript
// lib/supabase/server.ts
import { createSupabaseClientFactory } from "@thrivereflections/realtime-auth-supabase";
import { cookies } from "next/headers";

const supabaseFactory = createSupabaseClientFactory({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export async function createClient() {
  const cookieStore = await cookies();
  return await supabaseFactory.createServerClient(cookieStore);
}
```

#### Middleware Client

```typescript
// lib/supabase/middleware.ts
import { createSupabaseClientFactory } from "@thrivereflections/realtime-auth-supabase";
import { NextRequest } from "next/server";

const supabaseFactory = createSupabaseClientFactory({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export function createClient(request: NextRequest) {
  return supabaseFactory.createMiddlewareClient(request);
}
```

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional OAuth providers
SUPABASE_AUTH_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_GOOGLE_SECRET=your_google_secret
SUPABASE_AUTH_LINKEDIN_CLIENT_ID=your_linkedin_client_id
SUPABASE_AUTH_LINKEDIN_SECRET=your_linkedin_secret
SUPABASE_AUTH_FACEBOOK_CLIENT_ID=your_facebook_client_id
SUPABASE_AUTH_FACEBOOK_SECRET=your_facebook_secret
```

### Auth Provider Configuration

```typescript
interface AuthProviderConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  logger: Logger;
}
```

### User Sync Configuration

```typescript
interface UserSyncConfig {
  logger: Logger;
  createUserIfNotExists?: boolean;
  updateUserOnSync?: boolean;
}
```

## API Reference

### AuthProvider Interface

```typescript
interface AuthProvider {
  getCurrentUser(): Promise<User>;
  isAuthenticated(): Promise<boolean>;
  signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signInWithOAuth(provider: "google" | "linkedin" | "facebook"): Promise<void>;
  signOut(): Promise<void>;
  setSupabaseClient(client: SupabaseClient): void;
}
```

### UserSyncService Interface

```typescript
interface UserSyncService {
  syncUserToAppUser(supabaseUser: SupabaseUser): Promise<User | null>;
  getUserByAuthId(authUserId: string): Promise<User | null>;
  createUserFromSupabase(supabaseUser: SupabaseUser): Promise<User>;
  updateUserFromSupabase(user: User, supabaseUser: SupabaseUser): Promise<User>;
}
```

### SupabaseClientFactory Interface

```typescript
interface SupabaseClientFactory {
  createBrowserClient(): SupabaseClient | null;
  createServerClient(cookies: any): Promise<SupabaseClient>;
  createMiddlewareClient(request: any): { supabase: SupabaseClient; response: any };
}
```

## Key Features

### Multi-Provider Authentication

- **Google OAuth** - Google sign-in integration
- **LinkedIn OAuth** - LinkedIn sign-in integration
- **Facebook OAuth** - Facebook sign-in integration
- **Email/Password** - Traditional authentication
- **Anonymous Mode** - Works without authentication in development

### User Synchronization

- **Automatic Sync** - Sync Supabase users to your database
- **User Creation** - Create users if they don't exist
- **User Updates** - Update user information on sync
- **Auth ID Mapping** - Map Supabase auth IDs to your user IDs

### Session Management

- **JWT Tokens** - Secure JWT token handling
- **Session Persistence** - Persistent session management
- **Token Refresh** - Automatic token refresh
- **Session Validation** - Database-verified sessions

### Next.js Integration

- **Browser Client** - Client-side Supabase client
- **Server Client** - Server-side Supabase client
- **Middleware Client** - Middleware Supabase client
- **Cookie Management** - Automatic cookie handling

## Error Handling

All methods include comprehensive error handling and logging:

```typescript
const { user, error } = await authProvider.signInWithEmail(email, password);
if (error) {
  console.error("Sign in failed:", error.message);
  // Handle error appropriately
} else {
  console.log("User signed in:", user);
}
```

## Logging

The package integrates with the Thrive Realtime observability system:

```typescript
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("auth-session");
// Pass logger to all factory functions
```

## Dependencies

- `@supabase/supabase-js` - Supabase JavaScript client
- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface

## Related Documentation

- [Store](./store.md) - Uses auth for user management
- [Core Runtime](./core.md) - Uses auth for user context
- [Package README](../../packages/auth-supabase/README.md) - Detailed package documentation
