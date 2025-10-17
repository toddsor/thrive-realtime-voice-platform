# @thrivereflections/realtime-security

Security utilities and content safety features for the Thrive Realtime Voice Platform.

## Overview

This package provides comprehensive security features including content safety validation, PII redaction, rate limiting, and input validation to ensure secure voice platform operations.

## Installation

```bash
npm install @thrivereflections/realtime-security
```

## Main Exports

### Content Safety

- **`ContentSafetyValidator`** - Main content safety validator class
- **`contentSafetyValidator`** - Default validator instance
- **`isContentSafe(text)`** - Check if content is safe
- **`getContentSafetyScore(text)`** - Get safety score (0-1)
- **`validateContent(text, config)`** - Validate content with custom config
- **`SAFETY_CONFIGS`** - Predefined safety configurations

### PII Redaction

- **`PIIRedactor`** - Main PII redaction class
- **`piiRedactor`** - Default redactor instance
- **`redactPII(text, level)`** - Redact PII from text
- **`redact(text)`** - Redact PII with default level
- **`containsPII(text)`** - Check if text contains PII
- **`getPIITypes(text)`** - Get types of PII found
- **`createRedactorForLevel(level)`** - Create redactor for specific level
- **`REDACTION_LEVELS`** - Available redaction levels

### Rate Limiting

- **`RateLimiter`** - Main rate limiter class
- **`rateLimiter`** - Default rate limiter instance
- **`getClientIP(request)`** - Extract client IP from request
- **`getUserId(request)`** - Extract user ID from request
- **`checkRateLimit(identifier, limit)`** - Check rate limit
- **`RATE_LIMITS`** - Predefined rate limit configurations

## Usage Example

### Content Safety

```typescript
import {
  ContentSafetyValidator,
  isContentSafe,
  getContentSafetyScore,
  SAFETY_CONFIGS,
} from "@thrivereflections/realtime-security";

// Check if content is safe
const isSafe = isContentSafe("Hello, how are you?");
console.log(isSafe); // true

// Get safety score
const score = getContentSafetyScore("This is a test message");
console.log(score); // 0.95

// Use custom validator
const validator = new ContentSafetyValidator(SAFETY_CONFIGS.STRICT);
const result = validator.validate("User input text");
console.log(result.isSafe); // boolean
console.log(result.score); // number
console.log(result.violations); // string[]
```

### PII Redaction

```typescript
import { PIIRedactor, redactPII, redact, containsPII, REDACTION_LEVELS } from "@thrivereflections/realtime-security";

// Check for PII
const hasPII = containsPII("My email is john@example.com");
console.log(hasPII); // true

// Redact PII with default level
const redacted = redact("Call me at 555-123-4567 or email john@example.com");
console.log(redacted); // "Call me at [PHONE] or email [EMAIL]"

// Redact with specific level
const strictRedacted = redactPII("My SSN is 123-45-6789", REDACTION_LEVELS.STRICT);
console.log(strictRedacted); // "My SSN is [REDACTED]"

// Use custom redactor
const redactor = new PIIRedactor({
  phone: true,
  email: true,
  ssn: true,
  creditCard: false,
});
const customRedacted = redactor.redact("Contact: 555-123-4567");
```

### Rate Limiting

```typescript
import { RateLimiter, checkRateLimit, getClientIP, RATE_LIMITS } from "@thrivereflections/realtime-security";

// Check rate limit for client
const clientIP = getClientIP(request);
const isAllowed = await checkRateLimit(clientIP, RATE_LIMITS.API_CALLS);
console.log(isAllowed); // boolean

// Use custom rate limiter
const limiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => getClientIP(req),
});

const result = await limiter.check(request);
console.log(result.allowed); // boolean
console.log(result.remaining); // number
console.log(result.resetTime); // Date
```

## Configuration

### Content Safety Configuration

```typescript
interface ContentSafetyConfig {
  minScore: number; // Minimum safety score (0-1)
  checkToxicity: boolean;
  checkViolence: boolean;
  checkSexual: boolean;
  checkHate: boolean;
  customPatterns?: RegExp[];
}
```

### PII Redaction Configuration

```typescript
interface PIIRedactionConfig {
  phone: boolean;
  email: boolean;
  ssn: boolean;
  creditCard: boolean;
  address: boolean;
  customPatterns?: PIIPattern[];
}
```

### Rate Limiting Configuration

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator: (request: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}
```

## Predefined Configurations

### Safety Configs

- **`SAFETY_CONFIGS.LENIENT`** - Basic safety checks
- **`SAFETY_CONFIGS.MODERATE`** - Standard safety checks
- **`SAFETY_CONFIGS.STRICT`** - Strict safety checks

### Redaction Levels

- **`REDACTION_LEVELS.BASIC`** - Basic PII redaction
- **`REDACTION_LEVELS.STRICT`** - Strict PII redaction
- **`REDACTION_LEVELS.CUSTOM`** - Custom redaction rules

### Rate Limits

- **`RATE_LIMITS.API_CALLS`** - API call rate limiting
- **`RATE_LIMITS.SESSION_CREATION`** - Session creation limiting
- **`RATE_LIMITS.TOOL_EXECUTION`** - Tool execution limiting

## Key Features

- **Content Safety** - Multi-level content validation
- **PII Protection** - Comprehensive PII detection and redaction
- **Rate Limiting** - Configurable rate limiting with multiple strategies
- **Input Validation** - Secure input validation utilities
- **Performance** - Optimized for high-throughput security checks
- **Type Safety** - Full TypeScript support

## Integration

### With Store Package

```typescript
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { redact } from "@thrivereflections/realtime-security";

const store = createPrismaStore(config, {
  redact, // Use security package for PII redaction
});
```

### With API Routes

```typescript
import { checkRateLimit, getClientIP } from "@thrivereflections/realtime-security";

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  const isAllowed = await checkRateLimit(clientIP, RATE_LIMITS.API_CALLS);

  if (!isAllowed) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Process request
}
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions

## Related Documentation

- [Store](./store.md) - Uses security for PII redaction
- [SRE](./sre.md) - Uses security for monitoring
- [Package README](../../packages/security/README.md) - Detailed package documentation
