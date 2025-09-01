export interface APIRoute {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  handler: string;
  middleware: string[];
  rateLimit?: { requests: number; window: number };
  auth: 'none' | 'api_key' | 'jwt' | 'oauth';
  tenantId: string;
  enabled: boolean;
}

export interface APIVersion {
  version: string;
  status: 'active' | 'deprecated' | 'sunset';
  routes: APIRoute[];
  changelog: string;
  deprecationDate?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  retryPolicy: { maxRetries: number; backoff: 'linear' | 'exponential' };
  active: boolean;
  tenantId: string;
}

export class APIGateway {
  private routes: Map<string, APIRoute> = new Map();
  private versions: Map<string, APIVersion> = new Map();
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private requestLog: Array<{ timestamp: string; route: string; method: string; status: number; duration: number }> = [];

  registerRoute(route: Omit<APIRoute, 'id'>): APIRoute {
    const newRoute: APIRoute = {
      ...route,
      id: crypto.randomUUID()
    };

    this.routes.set(`${route.method}:${route.path}:${route.version}`, newRoute);
    return newRoute;
  }

  async handleRequest(request: {
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  }): Promise<{
    status: number;
    data: any;
    headers: Record<string, string>;
  }> {
    const startTime = Date.now();
    
    // Find matching route
    const route = this.findRoute(request.path, request.method, request.headers['api-version'] || 'v1');
    
    if (!route) {
      return { status: 404, data: { error: 'Route not found' }, headers: {} };
    }

    if (!route.enabled) {
      return { status: 503, data: { error: 'Service unavailable' }, headers: {} };
    }

    try {
      // Apply middleware
      const middlewareResult = await this.applyMiddleware(route.middleware, request);
      if (middlewareResult.status !== 200) {
        return middlewareResult;
      }

      // Execute handler
      const result = await this.executeHandler(route.handler, request);
      
      // Log request
      this.logRequest(route, request.method, result.status, Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.logRequest(route, request.method, 500, Date.now() - startTime);
      return { 
        status: 500, 
        data: { error: 'Internal server error' }, 
        headers: {} 
      };
    }
  }

  private findRoute(path: string, method: string, version: string): APIRoute | null {
    const exactMatch = this.routes.get(`${method}:${path}:${version}`);
    if (exactMatch) return exactMatch;

    // Pattern matching for dynamic routes
    for (const [key, route] of Array.from(this.routes.entries())) {
      if (route.method === method && route.version === version) {
        const pattern = route.path.replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(path)) return route;
      }
    }

    return null;
  }

  private async applyMiddleware(middleware: string[], request: any): Promise<any> {
    for (const middlewareName of middleware) {
      const result = await this.executeMiddleware(middlewareName, request);
      if (result.status !== 200) return result;
    }
    return { status: 200, data: null, headers: {} };
  }

  private async executeMiddleware(name: string, request: any): Promise<any> {
    switch (name) {
      case 'auth':
        return this.authMiddleware(request);
      case 'rate_limit':
        return this.rateLimitMiddleware(request);
      case 'cors':
        return this.corsMiddleware(request);
      default:
        return { status: 200, data: null, headers: {} };
    }
  }

  private async authMiddleware(request: any): Promise<any> {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return { status: 401, data: { error: 'Authorization required' }, headers: {} };
    }
    return { status: 200, data: null, headers: {} };
  }

  private async rateLimitMiddleware(request: any): Promise<any> {
    // Mock rate limiting - in production, use Redis or similar
    return { status: 200, data: null, headers: {} };
  }

  private async corsMiddleware(request: any): Promise<any> {
    return { 
      status: 200, 
      data: null, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }

  private async executeHandler(handler: string, request: any): Promise<any> {
    // Mock handler execution - in production, load actual handlers
    return {
      status: 200,
      data: { message: `Handler ${handler} executed successfully`, request: request.path },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  registerWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'secret'>): WebhookEndpoint {
    const newWebhook: WebhookEndpoint = {
      ...webhook,
      id: crypto.randomUUID(),
      secret: crypto.randomUUID()
    };

    this.webhooks.set(newWebhook.id, newWebhook);
    return newWebhook;
  }

  async triggerWebhook(event: string, data: any, tenantId: string): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(w => w.tenantId === tenantId && w.active && w.events.includes(event));

    const promises = relevantWebhooks.map(webhook => 
      this.sendWebhook(webhook, event, data)
    );

    await Promise.allSettled(promises);
  }

  private async sendWebhook(webhook: WebhookEndpoint, event: string, data: any): Promise<void> {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id
    };

    // Mock webhook delivery - in production, use actual HTTP client
    console.log(`Webhook sent to ${webhook.url}:`, payload);
  }

  createAPIVersion(version: string, routes: APIRoute[]): APIVersion {
    const apiVersion: APIVersion = {
      version,
      status: 'active',
      routes,
      changelog: `API version ${version} created`
    };

    this.versions.set(version, apiVersion);
    return apiVersion;
  }

  deprecateVersion(version: string, sunsetDate: string): void {
    const apiVersion = this.versions.get(version);
    if (apiVersion) {
      apiVersion.status = 'deprecated';
      apiVersion.deprecationDate = sunsetDate;
    }
  }

  private logRequest(route: APIRoute, method: string, status: number, duration: number): void {
    this.requestLog.push({
      timestamp: new Date().toISOString(),
      route: `${method} ${route.path}`,
      method,
      status,
      duration
    });

    // Keep only last 10000 requests
    if (this.requestLog.length > 10000) {
      this.requestLog = this.requestLog.slice(-10000);
    }
  }

  getAPIMetrics(): {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; requests: number }>;
  } {
    const total = this.requestLog.length;
    const avgTime = this.requestLog.reduce((sum, log) => sum + log.duration, 0) / total;
    const errors = this.requestLog.filter(log => log.status >= 400).length;
    
    const endpointCounts = this.requestLog.reduce((acc, log) => {
      acc[log.route] = (acc[log.route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, requests]) => ({ endpoint, requests }));

    return {
      totalRequests: total,
      avgResponseTime: avgTime,
      errorRate: errors / total,
      topEndpoints
    };
  }

  generateOpenAPISpec(version: string): any {
    const apiVersion = this.versions.get(version);
    if (!apiVersion) return null;

    return {
      openapi: '3.0.0',
      info: {
        title: 'InfinityStack API',
        version,
        description: 'Enterprise multi-tenant platform API'
      },
      paths: apiVersion.routes.reduce((paths, route) => {
        paths[route.path] = {
          [route.method.toLowerCase()]: {
            summary: `${route.method} ${route.path}`,
            parameters: [],
            responses: {
              '200': { description: 'Success' },
              '400': { description: 'Bad Request' },
              '401': { description: 'Unauthorized' },
              '500': { description: 'Internal Server Error' }
            }
          }
        };
        return paths;
      }, {} as any)
    };
  }
}