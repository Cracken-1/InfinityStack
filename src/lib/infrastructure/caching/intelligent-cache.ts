export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  size: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  evictions: number;
  memoryUsage: number;
  maxMemory: number;
  avgResponseTime: number;
}

export interface CachePolicy {
  name: string;
  maxSize: number;
  defaultTTL: number;
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'priority' | 'ai_optimized';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  replicationFactor: number;
}

export class IntelligentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    evictions: 0,
    memoryUsage: 0,
    maxMemory: 100 * 1024 * 1024, // 100MB default
    avgResponseTime: 0
  };
  private policy: CachePolicy;
  private accessPattern: Map<string, number[]> = new Map();

  constructor(policy: CachePolicy) {
    this.policy = policy;
    this.startMaintenanceTasks();
  }

  async get(key: string): Promise<any> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Update access metrics
    entry.lastAccessed = new Date().toISOString();
    entry.accessCount++;
    this.recordAccess(key);

    this.stats.totalHits++;
    this.updateStats();
    
    const responseTime = Date.now() - startTime;
    this.updateResponseTime(responseTime);

    return this.deserializeValue(entry.value);
  }

  async set(key: string, value: any, options: {
    ttl?: number;
    tags?: string[];
    priority?: CacheEntry['priority'];
    compress?: boolean;
  } = {}): Promise<void> {
    const serializedValue = this.serializeValue(value, options.compress);
    const size = this.calculateSize(serializedValue);

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    const entry: CacheEntry = {
      key,
      value: serializedValue,
      ttl: options.ttl || this.policy.defaultTTL,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      size,
      tags: options.tags || [],
      priority: options.priority || 'medium'
    };

    this.cache.set(key, entry);
    this.stats.memoryUsage += size;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.memoryUsage -= entry.size;
      return true;
    }
    return false;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        this.stats.memoryUsage -= entry.size;
        invalidated++;
      }
    }

    return invalidated;
  }

  async warmup(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.cache.has(key)) {
        try {
          const value = await dataLoader(key);
          await this.set(key, value, { priority: 'high' });
        } catch (error) {
          console.warn(`Failed to warm up cache for key ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  private async ensureCapacity(requiredSize: number): Promise<void> {
    while (this.stats.memoryUsage + requiredSize > this.stats.maxMemory) {
      const evicted = await this.evictEntry();
      if (!evicted) break; // No more entries to evict
    }
  }

  private async evictEntry(): Promise<boolean> {
    if (this.cache.size === 0) return false;

    let keyToEvict: string;

    switch (this.policy.evictionStrategy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
      case 'ttl':
        keyToEvict = this.findShortestTTLKey();
        break;
      case 'priority':
        keyToEvict = this.findLowestPriorityKey();
        break;
      case 'ai_optimized':
        keyToEvict = await this.findAIOptimizedKey();
        break;
      default:
        keyToEvict = this.cache.keys().next().value || '';
    }

    const entry = this.cache.get(keyToEvict);
    if (entry) {
      this.cache.delete(keyToEvict);
      this.stats.memoryUsage -= entry.size;
      this.stats.evictions++;
      return true;
    }

    return false;
  }

  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const accessTime = new Date(entry.lastAccessed).getTime();
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFUKey(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private findShortestTTLKey(): string {
    let shortestTTLKey = '';
    let shortestTTL = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const remainingTTL = this.getRemainingTTL(entry);
      if (remainingTTL < shortestTTL) {
        shortestTTL = remainingTTL;
        shortestTTLKey = key;
      }
    }

    return shortestTTLKey;
  }

  private findLowestPriorityKey(): string {
    const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    let lowestPriorityKey = '';
    let lowestPriority = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const priority = priorityOrder[entry.priority];
      if (priority < lowestPriority) {
        lowestPriority = priority;
        lowestPriorityKey = key;
      }
    }

    return lowestPriorityKey;
  }

  private async findAIOptimizedKey(): Promise<string> {
    // AI-based eviction considering multiple factors
    let bestKey = '';
    let lowestScore = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const score = this.calculateEvictionScore(entry);
      if (score < lowestScore) {
        lowestScore = score;
        bestKey = key;
      }
    }

    return bestKey;
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - new Date(entry.createdAt).getTime();
    const timeSinceAccess = now - new Date(entry.lastAccessed).getTime();
    const remainingTTL = this.getRemainingTTL(entry);
    
    // Factors for eviction score (lower = more likely to evict)
    let score = 0;

    // Priority factor (higher priority = higher score)
    const priorityWeights = { low: 1, medium: 2, high: 4, critical: 8 };
    score += priorityWeights[entry.priority] * 100;

    // Access frequency factor
    const accessFrequency = entry.accessCount / Math.max(1, age / (1000 * 60 * 60)); // accesses per hour
    score += accessFrequency * 50;

    // Recency factor
    const recencyScore = Math.max(0, 100 - (timeSinceAccess / (1000 * 60))); // Decay over minutes
    score += recencyScore;

    // TTL factor
    const ttlScore = Math.min(100, remainingTTL / (1000 * 60)); // Minutes remaining
    score += ttlScore;

    // Size factor (larger items slightly more likely to evict)
    const sizeScore = Math.max(0, 50 - (entry.size / 1024)); // KB penalty
    score += sizeScore;

    return score;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const createdAt = new Date(entry.createdAt).getTime();
    return (now - createdAt) > entry.ttl;
  }

  private getRemainingTTL(entry: CacheEntry): number {
    const now = Date.now();
    const createdAt = new Date(entry.createdAt).getTime();
    return Math.max(0, entry.ttl - (now - createdAt));
  }

  private recordAccess(key: string): void {
    const now = Date.now();
    const pattern = this.accessPattern.get(key) || [];
    
    // Keep only last 100 access times
    pattern.push(now);
    if (pattern.length > 100) {
      pattern.shift();
    }
    
    this.accessPattern.set(key, pattern);
  }

  private serializeValue(value: any, compress: boolean = false): any {
    let serialized = JSON.stringify(value);
    
    if (compress && this.policy.compressionEnabled) {
      // Mock compression - in production, use actual compression library
      serialized = `compressed:${serialized}`;
    }

    if (this.policy.encryptionEnabled) {
      // Mock encryption - in production, use actual encryption
      serialized = `encrypted:${serialized}`;
    }

    return serialized;
  }

  private deserializeValue(value: any): any {
    let deserialized = value;

    if (typeof deserialized === 'string') {
      if (deserialized.startsWith('encrypted:')) {
        deserialized = deserialized.substring(10);
      }
      
      if (deserialized.startsWith('compressed:')) {
        deserialized = deserialized.substring(11);
      }

      try {
        return JSON.parse(deserialized);
      } catch {
        return deserialized;
      }
    }

    return deserialized;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
  }

  private updateStats(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 ? 
      this.stats.totalHits / this.stats.totalRequests : 0;
    this.stats.missRate = 1 - this.stats.hitRate;
  }

  private updateResponseTime(responseTime: number): void {
    this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
  }

  private startMaintenanceTasks(): void {
    // Cleanup expired entries every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);

    // Optimize cache every 5 minutes
    setInterval(() => {
      this.optimizeCache();
    }, 300000);
  }

  private cleanupExpired(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.memoryUsage -= entry.size;
      }
    });
  }

  private async optimizeCache(): Promise<void> {
    // Analyze access patterns and adjust priorities
    for (const [key, entry] of Array.from(this.cache.entries())) {
      const pattern = this.accessPattern.get(key) || [];
      
      if (pattern.length > 10) {
        const recentAccesses = pattern.filter(time => Date.now() - time < 60 * 60 * 1000); // Last hour
        const accessRate = recentAccesses.length / 60; // Accesses per minute

        // Adjust priority based on access rate
        if (accessRate > 5 && entry.priority !== 'critical') {
          entry.priority = 'high';
        } else if (accessRate < 0.1 && entry.priority !== 'low') {
          entry.priority = 'low';
        }
      }
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getCacheInfo(): {
    totalEntries: number;
    memoryUsage: string;
    hitRate: string;
    topKeys: Array<{ key: string; accessCount: number; size: number }>;
  } {
    const entries = Array.from(this.cache.entries());
    const topKeys = entries
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount, size: entry.size }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalEntries: this.cache.size,
      memoryUsage: `${(this.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
      hitRate: `${(this.stats.hitRate * 100).toFixed(2)}%`,
      topKeys
    };
  }

  async preload(data: Array<{ key: string; value: any; options?: any }>): Promise<void> {
    const promises = data.map(({ key, value, options }) => 
      this.set(key, value, { ...options, priority: 'high' })
    );
    
    await Promise.all(promises);
  }

  exportCache(): Array<{ key: string; value: any; metadata: Partial<CacheEntry> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: this.deserializeValue(entry.value),
      metadata: {
        ttl: entry.ttl,
        createdAt: entry.createdAt,
        accessCount: entry.accessCount,
        tags: entry.tags,
        priority: entry.priority
      }
    }));
  }
}