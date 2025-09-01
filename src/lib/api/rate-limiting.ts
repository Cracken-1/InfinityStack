export interface RateLimit {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsPerWindow: number;
  remainingPoints: number;
  msBeforeNext: number;
  isFirstInWindow: boolean;
}

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  public config: RateLimit;

  constructor(config: RateLimit) {
    this.config = config;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean up expired entries
    this.cleanup(windowStart);

    const record = this.store.get(key);
    const isFirstInWindow = !record || record.resetTime <= windowStart;

    if (isFirstInWindow) {
      // First request in window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        allowed: true,
        info: {
          totalHits: 1,
          totalHitsPerWindow: 1,
          remainingPoints: this.config.maxRequests - 1,
          msBeforeNext: this.config.windowMs,
          isFirstInWindow: true
        }
      };
    }

    // Existing window
    const allowed = record.count < this.config.maxRequests;
    
    if (allowed) {
      record.count++;
    }

    return {
      allowed,
      info: {
        totalHits: record.count,
        totalHitsPerWindow: record.count,
        remainingPoints: Math.max(0, this.config.maxRequests - record.count),
        msBeforeNext: record.resetTime - now,
        isFirstInWindow: false
      }
    };
  }

  private cleanup(windowStart: number) {
    for (const [key, record] of Array.from(this.store.entries())) {
      if (record.resetTime <= windowStart) {
        this.store.delete(key);
      }
    }
  }

  reset(key: string) {
    this.store.delete(key);
  }

  getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: this.store.size,
      memoryUsage: this.store.size * 64 // Rough estimate
    };
  }
}

export class RateLimitManager {
  private limiters: Map<string, RateLimiter> = new Map();
  private tenantLimits: Map<string, Record<string, RateLimit>> = new Map();

  createLimiter(name: string, config: RateLimit): RateLimiter {
    const limiter = new RateLimiter(config);
    this.limiters.set(name, limiter);
    return limiter;
  }

  // Tenant-specific rate limits based on subscription tier
  setTenantLimits(tenantId: string, tier: 'starter' | 'professional' | 'enterprise') {
    const limits = {
      starter: {
        api: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
        upload: { windowMs: 60 * 60 * 1000, maxRequests: 5 }
      },
      professional: {
        api: { windowMs: 15 * 60 * 1000, maxRequests: 500 },
        upload: { windowMs: 60 * 60 * 1000, maxRequests: 25 }
      },
      enterprise: {
        api: { windowMs: 15 * 60 * 1000, maxRequests: 2000 },
        upload: { windowMs: 60 * 60 * 1000, maxRequests: 100 }
      }
    }
    
    this.tenantLimits.set(tenantId, limits[tier])
  }

  async checkTenantLimit(tenantId: string, limiterName: string, key: string) {
    const tenantConfig = this.tenantLimits.get(tenantId)?.[limiterName]
    if (tenantConfig) {
      const tenantLimiter = new RateLimiter(tenantConfig)
      return tenantLimiter.checkLimit(`${tenantId}:${key}`)
    }
    return this.checkLimit(limiterName, key)
  }

  async checkLimit(limiterName: string, key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      throw new Error(`Rate limiter '${limiterName}' not found`);
    }

    return limiter.checkLimit(key);
  }

  // Predefined rate limiters
  static createDefaultLimiters(): RateLimitManager {
    const manager = new RateLimitManager();

    // API rate limiting
    manager.createLimiter('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    });

    // Authentication rate limiting
    manager.createLimiter('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    });

    // File upload rate limiting
    manager.createLimiter('upload', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10
    });

    // Webhook rate limiting
    manager.createLimiter('webhook', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    });

    return manager;
  }

  // Middleware for Express.js
  middleware(limiterName: string, keyGenerator?: (req: any) => string) {
    return async (req: any, res: any, next: any) => {
      const key = keyGenerator ? keyGenerator(req) : req.ip || 'anonymous';
      
      try {
        const result = await this.checkLimit(limiterName, key);
        
        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.limiters.get(limiterName)?.config.maxRequests,
          'X-RateLimit-Remaining': result.info.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + result.info.msBeforeNext).toISOString()
        });

        if (!result.allowed) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil(result.info.msBeforeNext / 1000)
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Allow request on error
      }
    };
  }
}