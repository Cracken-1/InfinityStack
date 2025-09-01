import { createClient } from './supabase'
import { cache, withCache } from './cache'

class DatabaseOptimizer {
  private supabase = createClient()
  private batchQueue = new Map<string, any[]>()
  private batchTimeout: NodeJS.Timeout | null = null

  // Batch insert operations
  async batchInsert(table: string, records: any[], batchSize = 100) {
    const batches = []
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    const results = []
    for (const batch of batches) {
      const { data, error } = await this.supabase
        .from(table)
        .insert(batch)
        .select()
      
      if (error) throw error
      results.push(...(data || []))
    }
    
    return results
  }

  // Cached queries with automatic invalidation
  async cachedQuery(
    table: string, 
    query: any, 
    cacheKey: string, 
    ttl = 300000
  ) {
    return withCache(
      `query:${table}:${cacheKey}`,
      async () => {
        const { data, error } = await query
        if (error) throw error
        return data
      },
      ttl
    )
  }

  // Optimized pagination
  async paginatedQuery(
    table: string,
    page = 1,
    limit = 20,
    filters?: Record<string, any>,
    orderBy?: { column: string; ascending: boolean }
  ) {
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact' })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)
    
    if (error) throw error

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  }

  // Connection health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tenants')
        .select('id')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }

  // Query performance monitoring
  async monitoredQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - start
      
      // Log slow queries (>1s)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      console.error(`Query failed: ${queryName}`, error)
      throw error
    }
  }

  // Invalidate cache patterns
  invalidateCache(pattern: string) {
    const keys = Array.from((cache as any).cache.keys())
    keys.forEach(key => {
      if (String(key).includes(pattern)) {
        cache.delete(key as string)
      }
    })
  }
}

export const dbOptimizer = new DatabaseOptimizer()