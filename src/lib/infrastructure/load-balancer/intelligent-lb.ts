export interface ServerNode {
  id: string;
  host: string;
  port: number;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'draining';
  currentConnections: number;
  maxConnections: number;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  region: string;
  lastHealthCheck: string;
}

export interface LoadBalancingRule {
  id: string;
  name: string;
  algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'ip_hash' | 'geographic' | 'ai_optimized';
  conditions: {
    path?: string;
    method?: string;
    headers?: Record<string, string>;
    userAgent?: string;
    geoLocation?: string;
  };
  targetPool: string;
  priority: number;
  enabled: boolean;
}

export interface TrafficMetrics {
  timestamp: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
}

export class IntelligentLoadBalancer {
  private serverPools: Map<string, ServerNode[]> = new Map();
  private rules: LoadBalancingRule[] = [];
  private metrics: TrafficMetrics[] = [];
  private circuitBreakers: Map<string, { failures: number; lastFailure: string; state: 'closed' | 'open' | 'half-open' }> = new Map();

  addServerPool(poolName: string, servers: Omit<ServerNode, 'id' | 'currentConnections' | 'lastHealthCheck'>[]): void {
    const serverNodes: ServerNode[] = servers.map(server => ({
      ...server,
      id: crypto.randomUUID(),
      currentConnections: 0,
      lastHealthCheck: new Date().toISOString()
    }));

    this.serverPools.set(poolName, serverNodes);
    this.startHealthChecks(poolName);
  }

  addRule(rule: Omit<LoadBalancingRule, 'id'>): LoadBalancingRule {
    const newRule: LoadBalancingRule = {
      ...rule,
      id: crypto.randomUUID()
    };

    this.rules.push(newRule);
    this.rules.sort((a, b) => b.priority - a.priority);
    return newRule;
  }

  async routeRequest(request: {
    path: string;
    method: string;
    headers: Record<string, string>;
    clientIP: string;
    userAgent: string;
  }): Promise<{
    server: ServerNode;
    rule: LoadBalancingRule;
    routingDecision: string;
  }> {
    const startTime = Date.now();

    // Find matching rule
    const matchingRule = this.findMatchingRule(request);
    if (!matchingRule) {
      throw new Error('No matching routing rule found');
    }

    // Get server pool
    const serverPool = this.serverPools.get(matchingRule.targetPool);
    if (!serverPool || serverPool.length === 0) {
      throw new Error('No servers available in target pool');
    }

    // Select server based on algorithm
    const selectedServer = await this.selectServer(serverPool, matchingRule.algorithm, request);
    
    // Update connection count
    selectedServer.currentConnections++;

    // Record routing decision
    const routingDecision = this.explainRoutingDecision(matchingRule, selectedServer, request);

    return {
      server: selectedServer,
      rule: matchingRule,
      routingDecision
    };
  }

  private findMatchingRule(request: any): LoadBalancingRule | null {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let matches = true;

      if (rule.conditions.path && !request.path.match(rule.conditions.path)) {
        matches = false;
      }

      if (rule.conditions.method && rule.conditions.method !== request.method) {
        matches = false;
      }

      if (rule.conditions.headers) {
        for (const [key, value] of Object.entries(rule.conditions.headers)) {
          if (request.headers[key.toLowerCase()] !== value) {
            matches = false;
            break;
          }
        }
      }

      if (rule.conditions.userAgent && !request.userAgent.includes(rule.conditions.userAgent)) {
        matches = false;
      }

      if (matches) return rule;
    }

    return null;
  }

  private async selectServer(servers: ServerNode[], algorithm: string, request: any): Promise<ServerNode> {
    const healthyServers = servers.filter(s => s.status === 'healthy');
    
    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    switch (algorithm) {
      case 'round_robin':
        return this.roundRobinSelection(healthyServers);
      
      case 'weighted':
        return this.weightedSelection(healthyServers);
      
      case 'least_connections':
        return this.leastConnectionsSelection(healthyServers);
      
      case 'ip_hash':
        return this.ipHashSelection(healthyServers, request.clientIP);
      
      case 'geographic':
        return this.geographicSelection(healthyServers, request.clientIP);
      
      case 'ai_optimized':
        return await this.aiOptimizedSelection(healthyServers, request);
      
      default:
        return healthyServers[0];
    }
  }

  private roundRobinSelection(servers: ServerNode[]): ServerNode {
    // Simple round-robin based on current time
    const index = Math.floor(Date.now() / 1000) % servers.length;
    return servers[index];
  }

  private weightedSelection(servers: ServerNode[]): ServerNode {
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;

    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) return server;
    }

    return servers[0];
  }

  private leastConnectionsSelection(servers: ServerNode[]): ServerNode {
    return servers.reduce((min, server) => 
      server.currentConnections < min.currentConnections ? server : min
    );
  }

  private ipHashSelection(servers: ServerNode[], clientIP: string): ServerNode {
    // Simple hash of IP to ensure consistent routing
    let hash = 0;
    for (let i = 0; i < clientIP.length; i++) {
      hash = ((hash << 5) - hash + clientIP.charCodeAt(i)) & 0xffffffff;
    }
    const index = Math.abs(hash) % servers.length;
    return servers[index];
  }

  private geographicSelection(servers: ServerNode[], clientIP: string): ServerNode {
    // Mock geographic selection - in production, use GeoIP lookup
    const clientRegion = this.getClientRegion(clientIP);
    
    // Prefer servers in same region
    const sameRegionServers = servers.filter(s => s.region === clientRegion);
    if (sameRegionServers.length > 0) {
      return this.leastConnectionsSelection(sameRegionServers);
    }

    return this.leastConnectionsSelection(servers);
  }

  private async aiOptimizedSelection(servers: ServerNode[], request: any): Promise<ServerNode> {
    // AI-based server selection considering multiple factors
    const scores = servers.map(server => {
      let score = 0;

      // Response time factor (lower is better)
      score += (1000 - server.responseTime) / 1000 * 0.3;

      // CPU usage factor (lower is better)
      score += (100 - server.cpuUsage) / 100 * 0.25;

      // Memory usage factor (lower is better)
      score += (100 - server.memoryUsage) / 100 * 0.2;

      // Connection load factor (lower is better)
      const connectionRatio = server.currentConnections / server.maxConnections;
      score += (1 - connectionRatio) * 0.25;

      return { server, score };
    });

    // Select server with highest score
    const bestServer = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return bestServer.server;
  }

  private getClientRegion(clientIP: string): string {
    // Mock GeoIP lookup - in production, use actual GeoIP service
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private explainRoutingDecision(rule: LoadBalancingRule, server: ServerNode, request: any): string {
    return `Routed to ${server.host}:${server.port} using ${rule.algorithm} algorithm. ` +
           `Rule: ${rule.name}. Server load: ${server.currentConnections}/${server.maxConnections} connections, ` +
           `CPU: ${server.cpuUsage}%, Response time: ${server.responseTime}ms`;
  }

  private startHealthChecks(poolName: string): void {
    setInterval(() => {
      this.performHealthChecks(poolName);
    }, 30000); // Every 30 seconds
  }

  private async performHealthChecks(poolName: string): Promise<void> {
    const servers = this.serverPools.get(poolName);
    if (!servers) return;

    for (const server of servers) {
      try {
        const isHealthy = await this.checkServerHealth(server);
        
        if (isHealthy) {
          server.status = 'healthy';
          this.resetCircuitBreaker(server.id);
        } else {
          this.handleServerFailure(server);
        }

        server.lastHealthCheck = new Date().toISOString();
      } catch (error) {
        this.handleServerFailure(server);
      }
    }
  }

  private async checkServerHealth(server: ServerNode): Promise<boolean> {
    // Mock health check - in production, make actual HTTP request
    const startTime = Date.now();
    
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    const responseTime = Date.now() - startTime;
    server.responseTime = responseTime;
    
    // Update resource usage (mock)
    server.cpuUsage = 20 + Math.random() * 60;
    server.memoryUsage = 30 + Math.random() * 50;

    // 95% success rate for health checks
    return Math.random() > 0.05;
  }

  private handleServerFailure(server: ServerNode): void {
    const circuitBreaker = this.circuitBreakers.get(server.id) || { failures: 0, lastFailure: '', state: 'closed' };
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date().toISOString();

    if (circuitBreaker.failures >= 3) {
      server.status = 'unhealthy';
      circuitBreaker.state = 'open';
    }

    this.circuitBreakers.set(server.id, circuitBreaker);
  }

  private resetCircuitBreaker(serverId: string): void {
    const circuitBreaker = this.circuitBreakers.get(serverId);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
    }
  }

  async completeRequest(serverId: string, success: boolean, responseTime: number): Promise<void> {
    // Find and update server
    for (const servers of Array.from(this.serverPools.values())) {
      const server = servers.find(s => s.id === serverId);
      if (server) {
        server.currentConnections = Math.max(0, server.currentConnections - 1);
        server.responseTime = (server.responseTime + responseTime) / 2; // Moving average
        break;
      }
    }

    // Update metrics
    this.updateMetrics(success, responseTime);
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    const now = new Date();
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    
    let currentMetrics = this.metrics.find(m => m.timestamp === currentMinute.toISOString());
    
    if (!currentMetrics) {
      currentMetrics = {
        timestamp: currentMinute.toISOString(),
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0
      };
      this.metrics.push(currentMetrics);
    }

    currentMetrics.totalRequests++;
    if (success) {
      currentMetrics.successfulRequests++;
    } else {
      currentMetrics.failedRequests++;
    }

    currentMetrics.avgResponseTime = (currentMetrics.avgResponseTime + responseTime) / 2;
    currentMetrics.errorRate = currentMetrics.failedRequests / currentMetrics.totalRequests;
    currentMetrics.throughput = currentMetrics.totalRequests; // Requests per minute

    // Keep only last 24 hours of metrics
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  getServerPools(): Map<string, ServerNode[]> {
    return this.serverPools;
  }

  getMetrics(hours: number = 1): TrafficMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  getLoadBalancingRules(): LoadBalancingRule[] {
    return this.rules;
  }

  async autoScale(poolName: string): Promise<{
    action: 'scale_up' | 'scale_down' | 'no_action';
    reason: string;
    newCapacity?: number;
  }> {
    const servers = this.serverPools.get(poolName);
    if (!servers) return { action: 'no_action', reason: 'Pool not found' };

    const recentMetrics = this.getMetrics(0.25); // Last 15 minutes
    if (recentMetrics.length === 0) return { action: 'no_action', reason: 'No metrics available' };

    const avgCpuUsage = servers.reduce((sum, s) => sum + s.cpuUsage, 0) / servers.length;
    const avgConnections = servers.reduce((sum, s) => sum + s.currentConnections, 0) / servers.length;
    const maxConnections = servers.reduce((sum, s) => sum + s.maxConnections, 0) / servers.length;
    const connectionRatio = avgConnections / maxConnections;

    // Scale up conditions
    if (avgCpuUsage > 80 || connectionRatio > 0.8) {
      return {
        action: 'scale_up',
        reason: `High resource usage: CPU ${avgCpuUsage.toFixed(1)}%, Connections ${(connectionRatio * 100).toFixed(1)}%`,
        newCapacity: servers.length + Math.ceil(servers.length * 0.5)
      };
    }

    // Scale down conditions
    if (avgCpuUsage < 30 && connectionRatio < 0.3 && servers.length > 2) {
      return {
        action: 'scale_down',
        reason: `Low resource usage: CPU ${avgCpuUsage.toFixed(1)}%, Connections ${(connectionRatio * 100).toFixed(1)}%`,
        newCapacity: Math.max(2, servers.length - 1)
      };
    }

    return { action: 'no_action', reason: 'Resource usage within normal range' };
  }
}