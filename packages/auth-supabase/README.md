# @thrive/realtime-auth-supabase

Supabase authentication provider for the Thrive Realtime Voice Platform.

## Overview

This package provides a complete authentication solution using Supabase Auth with multi-provider support (Google, LinkedIn, Facebook, email/password). It includes user synchronization, session management, and client utilities for Next.js applications.

## Features

- **Multi-Provider Authentication**: Google, LinkedIn, Facebook, and email/password
- **User Synchronization**: Automatic sync from Supabase to your database
- **Session Management**: JWT tokens with database verification
- **Next.js Integration**: Browser, server, and middleware client utilities
- **TypeScript Support**: Full type safety and IntelliSense
- **Logging Integration**: Built-in observability and debugging

## Installation

```bash
npm install @thrive/realtime-auth-supabase
```

## Usage

### Basic Setup

```typescript
import { createAuthProvider, createSupabaseClientFactory, createUserSyncService } from "@thrive/realtime-auth-supabase";
import { InjectableConsoleLogger } from "@thrive/realtime-observability";

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

### User Synchronization

```typescript
import { createUserSyncService } from "@thrive/realtime-auth-supabase";

// Create user sync service with your database store
const userSync = createUserSyncService(yourDatabaseStore, { logger });

// Sync Supabase user to your database
const user = await userSync.syncUserToAppUser(supabaseUser);
```

### Next.js Integration

#### Browser Client

```typescript
// lib/supabase/client.ts
import { createSupabaseClientFactory } from "@thrive/realtime-auth-supabase";

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
import { createSupabaseClientFactory } from "@thrive/realtime-auth-supabase";
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
import { createSupabaseClientFactory } from "@thrive/realtime-auth-supabase";
import { NextRequest } from "next/server";

const supabaseFactory = createSupabaseClientFactory({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export function createClient(request: NextRequest) {
  return supabaseFactory.createMiddlewareClient(request);
}
```

## API Reference

### AuthProvider

The main authentication interface with methods for user management and authentication.

```typescript
interface AuthProvider {
  getCurrentUser(): Promise<User>;
  isAuthenticated(): Promise<boolean>;
  signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signInWithOAuth(provider: "google" | "linkedin" | "facebook"): Promise<void>;
  signOut(): Promise<void>;
}
```

### UserSyncService

Handles synchronization between Supabase users and your database.

```typescript
interface UserSyncService {
  syncUserToAppUser(supabaseUser: SupabaseUser): Promise<User | null>;
  getUserByAuthId(authUserId: string): Promise<User | null>;
}
```

### SupabaseClientFactory

Creates Supabase clients for different Next.js contexts.

```typescript
interface SupabaseClientFactory {
  createBrowserClient(): SupabaseClient | null;
  createServerClient(cookies: any): Promise<SupabaseClient>;
  createMiddlewareClient(request: any): { supabase: SupabaseClient; response: any };
}
```

## Configuration

### Environment Variables

```bash
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

## Error Handling

All methods include comprehensive error handling and logging. Errors are logged with context and returned in a consistent format:

```typescript
const { user, error } = await authProvider.signInWithEmail(email, password);
if (error) {
  console.error("Sign in failed:", error.message);
  // Handle error
}
```

## Logging

The package integrates with the Thrive Realtime observability system for comprehensive logging and debugging:

```typescript
import { InjectableConsoleLogger } from "@thrive/realtime-observability";

const logger = new InjectableConsoleLogger("auth-session");
// Pass logger to all factory functions
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions and IntelliSense support.

## License

MIT
