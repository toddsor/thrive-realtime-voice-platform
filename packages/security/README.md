# @thrivereflections/realtime-security

Security utilities for the Thrive Realtime Voice Platform including PII redaction, rate limiting, and content safety.

## Features

- **PII Redaction**: Automatic detection and redaction of personally identifiable information
- **Rate Limiting**: Identity-aware rate limiting with cookie-based tracking
- **Content Safety**: Input validation and content filtering
- **Security Events**: Audit logging for security-related events

## Installation

```bash
npm install @thrivereflections/realtime-security
```

## Usage

### PII Redaction

```typescript
import { redactPII } from "@thrivereflections/realtime-security";

// Redact PII from text
const originalText = "My email is user@example.com and my phone is 555-123-4567";
const redactedText = redactPII(originalText);
console.log(redactedText); // "My email is [EMAIL_REDACTED] and my phone is [PHONE_REDACTED]"

// Check if text contains PII
const hasPII = containsPII(originalText);
console.log(hasPII); // true
```

### Rate Limiting

```typescript
import { RATE_LIMITS, createRateLimiter } from "@thrivereflections/realtime-security";

// Create rate limiter
const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => `user:${req.userId}`,
});

// Check rate limit
const result = await rateLimiter.checkLimit("user:123");
if (!result.allowed) {
  console.log("Rate limit exceeded:", result.remaining);
}
```

### Identity-Aware Rate Limiting

```typescript
import { RATE_LIMITS } from "@thrivereflections/realtime-security";

// Use predefined rate limits with identity support
const sessionLimit = RATE_LIMITS.SESSION_CREATION;
const toolLimit = RATE_LIMITS.TOOL_CALLS;
const apiLimit = RATE_LIMITS.API_REQUESTS;

// Rate limits automatically use anonymousId/pseudonymousId cookies
// when available, falling back to IP-based limiting
```

### Content Safety

```typescript
import { ContentSafety, DEFAULT_CONTENT_SAFETY_RULES } from "@thrivereflections/realtime-security";

// Create content safety validator
const contentSafety = new ContentSafety(DEFAULT_CONTENT_SAFETY_RULES, logger);

// Validate content
const result = await contentSafety.validateContent("This is safe content");
if (!result.valid) {
  console.log("Content blocked:", result.reason);
}
```

### Security Event Logging

```typescript
import { SecurityMonitor } from "@thrivereflections/realtime-security";

// Create security monitor
const securityMonitor = new SecurityMonitor(logger);

// Log security events
securityMonitor.logSecurityEvent("pii_redacted", "medium", "PII redacted from user input", {
  userId: "user_123",
  redactionCount: 2,
});

securityMonitor.logSecurityEvent("rate_limit_exceeded", "high", "Rate limit exceeded", {
  key: "user:123",
  count: 101,
});
```

## API Reference

### PII Redaction

#### `redactPII(text: string): string`

Redacts PII from text using predefined patterns.

**Parameters:**

- `text` - Input text to redact

**Returns:**

- Redacted text with PII replaced by placeholders

#### `containsPII(text: string): boolean`

Checks if text contains PII patterns.

**Parameters:**

- `text` - Input text to check

**Returns:**

- `true` if PII detected, `false` otherwise

### Rate Limiting

#### `createRateLimiter(config: RateLimiterConfig): RateLimiter`

Creates a rate limiter with custom configuration.

**Configuration:**

```typescript
interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (req: Request) => string; // Key generation function
  onLimitReached?: (key: string, count: number) => void; // Callback
}
```

#### `RATE_LIMITS`

Predefined rate limit configurations with identity support:

- `SESSION_CREATION` - Session creation limits (10/hour)
- `TOOL_CALLS` - Tool execution limits (30/minute)
- `API_REQUESTS` - General API limits (100/15min)

### Content Safety

#### `ContentSafety`

Content validation and filtering class.

**Methods:**

- `validateContent(text: string): Promise<ValidationResult>` - Validate content
- `detectLanguage(text: string): Promise<string>` - Detect content language

#### `DEFAULT_CONTENT_SAFETY_RULES`

Default content safety configuration:

```typescript
const DEFAULT_CONTENT_SAFETY_RULES = {
  enabled: true,
  maxLength: 10000,
  blockedPatterns: [
    /(?:kill|murder|suicide|self-harm)/i,
    /(?:hate|discrimination|racism|sexism)/i,
    /(?:violence|weapon|gun|bomb)/i,
    /(?:drug|alcohol|substance abuse)/i,
    /(?:sexual|pornographic|explicit)/i,
  ],
  allowedLanguages: ["en", "es", "fr", "de"],
  moderationThreshold: 0.8,
};
```

### Security Monitoring

#### `SecurityMonitor`

Security event logging and monitoring.

**Methods:**

- `logSecurityEvent(type: string, severity: string, message: string, meta?: object)` - Log security event
- `getSecurityEvents(filter?: SecurityEventFilter)` - Get security events
- `clearSecurityEvents()` - Clear security event history

## Identity Integration

The security package integrates with the platform's identity system:

### PII Handling by Identity Level

```typescript
// Different PII handling based on identity level
const piiHandling = {
  ephemeral: "block", // Block execution if PII detected
  local: "allow", // Allow PII in local storage
  anonymous: "redact", // Redact PII before storage
  pseudonymous: "redact", // Redact PII before storage
  authenticated: "allow", // Allow PII with user consent
};
```

### Identity-Aware Rate Limiting

```typescript
// Rate limits use identity information when available
const keyGenerator = (req: Request) => {
  const anon = req.cookies.get("anon_id")?.value;
  const pseud = req.cookies.get("pseud_id")?.value;
  const userId = req.headers.get("x-user-id");

  if (userId) return `user:${userId}`;
  if (pseud) return `pseud:${pseud}`;
  if (anon) return `anon:${anon}`;
  return `ip:${getClientIP(req)}`;
};
```

## Configuration

### Environment Variables

```bash
# PII Redaction
SECURITY_PII_REDACTION_ENABLED=true
SECURITY_PII_LOG_REDACTIONS=true

# Rate Limiting
SECURITY_RATE_LIMITING_ENABLED=true
SECURITY_RATE_LIMIT_WINDOW_MS=900000
SECURITY_RATE_LIMIT_MAX_REQUESTS=100

# Content Safety
SECURITY_CONTENT_SAFETY_ENABLED=true
SECURITY_MAX_CONTENT_LENGTH=10000
SECURITY_MODERATION_THRESHOLD=0.8
```

### Runtime Configuration

```typescript
import { loadSecurityConfig } from "@thrivereflections/realtime-config";

const securityConfig = loadSecurityConfig({
  piiRedaction: {
    enabled: process.env.SECURITY_PII_REDACTION_ENABLED === "true",
    logRedactions: process.env.SECURITY_PII_LOG_REDACTIONS === "true",
  },
  rateLimiting: {
    enabled: process.env.SECURITY_RATE_LIMITING_ENABLED === "true",
    windowMs: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW_MS || "900000"),
    maxRequests: parseInt(process.env.SECURITY_RATE_LIMIT_MAX_REQUESTS || "100"),
  },
  contentSafety: {
    enabled: process.env.SECURITY_CONTENT_SAFETY_ENABLED === "true",
    maxLength: parseInt(process.env.SECURITY_MAX_CONTENT_LENGTH || "10000"),
    moderationThreshold: parseFloat(process.env.SECURITY_MODERATION_THRESHOLD || "0.8"),
  },
});
```

## Examples

### Complete Security Setup

```typescript
import {
  redactPII,
  createRateLimiter,
  ContentSafety,
  SecurityMonitor,
  RATE_LIMITS,
} from "@thrivereflections/realtime-security";

// Setup security components
const rateLimiter = createRateLimiter(RATE_LIMITS.API_REQUESTS);
const contentSafety = new ContentSafety(DEFAULT_CONTENT_SAFETY_RULES, logger);
const securityMonitor = new SecurityMonitor(logger);

// Secure API endpoint
export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResult = await rateLimiter.checkLimit(request);
  if (!rateLimitResult.allowed) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Validate content
  const { text } = await request.json();
  const contentResult = await contentSafety.validateContent(text);
  if (!contentResult.valid) {
    securityMonitor.logSecurityEvent("content_blocked", "medium", "Content validation failed");
    return new Response("Content not allowed", { status: 400 });
  }

  // Redact PII
  const redactedText = redactPII(text);
  if (redactedText !== text) {
    securityMonitor.logSecurityEvent("pii_redacted", "low", "PII redacted from input");
  }

  // Process request...
  return new Response(JSON.stringify({ processed: redactedText }));
}
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface

## Related Documentation

- [Security Guide](../../docs/guides/security.md) - Comprehensive security documentation
- [Identity Guide](../../docs/guides/anonymity-levels.md) - Identity level integration
- [API Reference](../../docs/api/auth.md) - Identity management APIs
