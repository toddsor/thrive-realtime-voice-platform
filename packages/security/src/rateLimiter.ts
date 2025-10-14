export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator: (req: Request) => string; // IP or user ID
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private entries = new Map<string, RateLimitEntry>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry) {
      // First request for this key
      this.entries.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (now >= entry.resetTime) {
      // Window has expired, reset
      this.entries.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const entry = this.entries.get(key);
    if (!entry) {
      return config.maxRequests;
    }

    const now = Date.now();
    if (now >= entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  getResetTime(key: string, config: RateLimitConfig): number {
    const entry = this.entries.get(key);
    if (!entry) {
      return Date.now() + config.windowMs;
    }

    return entry.resetTime;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now >= entry.resetTime) {
        this.entries.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default IP if we can't determine it
  return 'unknown';
}

// Helper function to get user ID from request (for authenticated users)
export function getUserId(_request: Request): string | null {
  // This would typically come from JWT token or session
  // For now, return null as we're using anonymous auth
  return null;
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  SESSION_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req: Request) => `session:${getClientIP(req)}`
  },
  
  TOOL_CALLS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: Request) => `tools:${getClientIP(req)}`
  },
  
  API_REQUESTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: Request) => `api:${getClientIP(req)}`
  }
} as const;

// Rate limit middleware function
export function checkRateLimit(
  request: Request, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = config.keyGenerator(request);
  const allowed = rateLimiter.isAllowed(key, config);
  const remaining = rateLimiter.getRemainingRequests(key, config);
  const resetTime = rateLimiter.getResetTime(key, config);
  
  return { allowed, remaining, resetTime };
}
