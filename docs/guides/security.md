# Security Guide

The Thrive Realtime Voice Platform provides comprehensive security features including content safety validation, PII redaction, rate limiting, and payload validation. The security system is designed to protect both users and the platform from various threats while maintaining performance and usability.

## Content Safety

### Content Validation

The platform validates all user inputs and AI responses for safety:

```typescript
export interface ContentSafetyConfig {
  enabled: boolean;
  maxLength: number;
  blockedPatterns: RegExp[];
  allowedLanguages: string[];
  moderationThreshold: number;
}

export class ContentSafety {
  constructor(
    private config: ContentSafetyConfig,
    private logger: Logger
  ) {}

  async validateContent(text: string): Promise<ValidationResult> {
    if (!this.config.enabled) {
      return { valid: true };
    }

    // Check length
    if (text.length > this.config.maxLength) {
      return {
        valid: false,
        reason: 'Content too long',
        code: 'CONTENT_TOO_LONG'
      };
    }

    // Check blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(text)) {
        this.logger.warn('Blocked content detected', {
          pattern: pattern.source,
          text: this.redactForLogging(text)
        });
        
        return {
          valid: false,
          reason: 'Content contains blocked patterns',
          code: 'BLOCKED_CONTENT'
        };
      }
    }

    // Check language
    const language = await this.detectLanguage(text);
    if (!this.config.allowedLanguages.includes(language)) {
      return {
        valid: false,
        reason: 'Language not allowed',
        code: 'LANGUAGE_NOT_ALLOWED'
      };
    }

    return { valid: true };
  }
}
```

### Content Safety Rules

```typescript
export const DEFAULT_CONTENT_SAFETY_RULES: ContentSafetyConfig = {
  enabled: true,
  maxLength: 10000,
  blockedPatterns: [
    /(?:kill|murder|suicide|self-harm)/i,
    /(?:hate|discrimination|racism|sexism)/i,
    /(?:violence|weapon|gun|bomb)/i,
    /(?:drug|alcohol|substance abuse)/i,
    /(?:sexual|pornographic|explicit)/i
  ],
  allowedLanguages: ['en', 'es', 'fr', 'de'],
  moderationThreshold: 0.8
};
```

## PII Redaction

### Automatic PII Detection

The platform automatically detects and redacts personally identifiable information:

```typescript
export interface PIIRedactionConfig {
  enabled: boolean;
  redactionPatterns: {
    email: RegExp;
    phone: RegExp;
    ssn: RegExp;
    creditCard: RegExp;
    address: RegExp;
  };
  replacementChar: string;
  logRedactions: boolean;
}

export class PIIRedaction {
  constructor(
    private config: PIIRedactionConfig,
    private logger: Logger
  ) {}

  redactText(text: string): string {
    if (!this.config.enabled) {
      return text;
    }

    let redacted = text;
    
    // Redact email addresses
    redacted = redacted.replace(
      this.config.redactionPatterns.email,
      `[EMAIL_REDACTED]`
    );
    
    // Redact phone numbers
    redacted = redacted.replace(
      this.config.redactionPatterns.phone,
      `[PHONE_REDACTED]`
    );
    
    // Redact SSNs
    redacted = redacted.replace(
      this.config.redactionPatterns.ssn,
      `[SSN_REDACTED]`
    );
    
    // Redact credit cards
    redacted = redacted.replace(
      this.config.redactionPatterns.creditCard,
      `[CARD_REDACTED]`
    );

    if (redacted !== text && this.config.logRedactions) {
      this.logger.info('PII redaction applied', {
        originalLength: text.length,
        redactedLength: redacted.length
      });
    }

    return redacted;
  }
}
```

### PII Redaction Patterns

```typescript
export const DEFAULT_PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  address: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi
};
```

## Rate Limiting

### API Rate Limiting

The platform implements comprehensive rate limiting to prevent abuse:

```typescript
export interface RateLimiterConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: Request) => string;
  onLimitReached: (key: string, count: number) => void;
}

export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private config: RateLimiterConfig,
    private logger: Logger
  ) {}

  async checkLimit(key: string): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean up expired entries
    for (const [k, v] of this.requests.entries()) {
      if (v.resetTime < now) {
        this.requests.delete(k);
      }
    }

    const current = this.requests.get(key);
    
    if (!current || current.resetTime < now) {
      // New window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      
      return { allowed: true, remaining: this.config.maxRequests - 1 };
    }

    if (current.count >= this.config.maxRequests) {
      this.config.onLimitReached(key, current.count);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    current.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count
    };
  }
}
```

### Rate Limiting Strategies

```typescript
// Per-user rate limiting
const userRateLimit = new RateLimiter({
  enabled: true,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => `user:${req.userId}`,
  onLimitReached: (key, count) => {
    logger.warn('User rate limit exceeded', { key, count });
  }
});

// Per-IP rate limiting
const ipRateLimit = new RateLimiter({
  enabled: true,
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  keyGenerator: (req) => `ip:${req.ip}`,
  onLimitReached: (key, count) => {
    logger.warn('IP rate limit exceeded', { key, count });
  }
});
```

## Input Validation

### Payload Validation

All incoming requests are validated against strict schemas:

```typescript
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
    properties?: ValidationSchema;
  };
}

export class InputValidator {
  constructor(
    private schemas: Map<string, ValidationSchema>,
    private logger: Logger
  ) {}

  validate(payload: unknown, schemaName: string): ValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return {
        valid: false,
        reason: `Unknown schema: ${schemaName}`,
        code: 'UNKNOWN_SCHEMA'
      };
    }

    return this.validateObject(payload, schema);
  }

  private validateObject(obj: unknown, schema: ValidationSchema): ValidationResult {
    if (typeof obj !== 'object' || obj === null) {
      return {
        valid: false,
        reason: 'Expected object',
        code: 'INVALID_TYPE'
      };
    }

    for (const [key, rules] of Object.entries(schema)) {
      const value = (obj as any)[key];
      
      if (rules.required && (value === undefined || value === null)) {
        return {
          valid: false,
          reason: `Required field missing: ${key}`,
          code: 'MISSING_REQUIRED_FIELD'
        };
      }

      if (value !== undefined && value !== null) {
        const result = this.validateValue(value, rules);
        if (!result.valid) {
          return result;
        }
      }
    }

    return { valid: true };
  }
}
```

### Common Validation Schemas

```typescript
export const COMMON_SCHEMAS = {
  sessionCreate: {
    userId: { type: 'string', required: true, minLength: 1 },
    skill: { type: 'string', required: true, enum: ['voice', 'chat'] },
    config: { type: 'object', required: true }
  },
  
  transcriptAppend: {
    sessionId: { type: 'string', required: true, minLength: 1 },
    content: { type: 'string', required: true, maxLength: 10000 },
    timestamp: { type: 'number', required: true }
  },
  
  toolCall: {
    sessionId: { type: 'string', required: true },
    toolName: { type: 'string', required: true },
    parameters: { type: 'object', required: true }
  }
};
```

## Security Best Practices

### 1. Enable All Security Features

```typescript
const securityConfig = {
  contentSafety: {
    enabled: true,
    maxLength: 10000,
    blockedPatterns: DEFAULT_CONTENT_SAFETY_RULES.blockedPatterns,
    allowedLanguages: ['en'],
    moderationThreshold: 0.8
  },
  
  piiRedaction: {
    enabled: true,
    redactionPatterns: DEFAULT_PII_PATTERNS,
    replacementChar: '[REDACTED]',
    logRedactions: true
  },
  
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => `user:${req.userId}`
  }
};
```

### 2. Validate All Inputs

```typescript
// Always validate incoming data
const validationResult = inputValidator.validate(requestBody, 'sessionCreate');
if (!validationResult.valid) {
  return response.status(400).json({
    error: validationResult.reason,
    code: validationResult.code
  });
}
```

### 3. Redact Sensitive Data in Logs

```typescript
// Use redacted data for logging
logger.info('User action', {
  userId: user.id,
  action: 'session_created',
  // Don't log sensitive data
  // sessionData: redactPII(sessionData)
});
```

### 4. Monitor Security Events

```typescript
// Set up security monitoring
securityMonitor.on('contentBlocked', (event) => {
  logger.warn('Content blocked', {
    userId: event.userId,
    reason: event.reason,
    timestamp: event.timestamp
  });
});

securityMonitor.on('rateLimitExceeded', (event) => {
  logger.warn('Rate limit exceeded', {
    key: event.key,
    count: event.count,
    timestamp: event.timestamp
  });
});
```

## Security Configuration

### Environment Variables

```bash
# Security settings
SECURITY_CONTENT_SAFETY_ENABLED=true
SECURITY_PII_REDACTION_ENABLED=true
SECURITY_RATE_LIMITING_ENABLED=true
SECURITY_MAX_CONTENT_LENGTH=10000
SECURITY_RATE_LIMIT_WINDOW_MS=900000
SECURITY_RATE_LIMIT_MAX_REQUESTS=100
```

### Runtime Configuration

```typescript
import { loadSecurityConfig } from '@thrive/realtime-config';

const securityConfig = loadSecurityConfig({
  contentSafety: {
    enabled: process.env.SECURITY_CONTENT_SAFETY_ENABLED === 'true',
    maxLength: parseInt(process.env.SECURITY_MAX_CONTENT_LENGTH || '10000'),
    // ... other settings
  }
});
```
