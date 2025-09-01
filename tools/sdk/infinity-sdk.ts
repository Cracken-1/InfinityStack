export interface SDKConfig {
  apiKey: string;
  baseURL: string;
  tenantId: string;
  version?: string;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    rateLimit?: {
      remaining: number;
      reset: string;
    };
  };
}

export class InfinitySDK {
  private config: SDKConfig;
  private httpClient: HTTPClient;

  constructor(config: SDKConfig) {
    this.config = {
      version: 'v1',
      timeout: 30000,
      retries: 3,
      ...config
    };
    
    this.httpClient = new HTTPClient(this.config);
  }

  // AI & ML Methods
  ai = {
    predict: async (modelId: string, input: any): Promise<APIResponse<{
      prediction: any;
      confidence: number;
    }>> => {
      return this.httpClient.post(`/ai/models/${modelId}/predict`, { input });
    },

    trainModel: async (config: {
      name: string;
      type: string;
      dataset: any;
      parameters?: Record<string, any>;
    }): Promise<APIResponse<{ modelId: string; status: string }>> => {
      return this.httpClient.post('/ai/models/train', config);
    },

    getModels: async (): Promise<APIResponse<Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      accuracy?: number;
    }>>> => {
      return this.httpClient.get('/ai/models');
    },

    chat: async (message: string, sessionId?: string): Promise<APIResponse<{
      response: string;
      actions?: any[];
      sessionId: string;
    }>> => {
      return this.httpClient.post('/ai/chat', { message, sessionId });
    }
  };

  // Data Management
  data = {
    query: async (query: string, params?: Record<string, any>): Promise<APIResponse<any[]>> => {
      return this.httpClient.post('/data/query', { query, params });
    },

    create: async (entity: string, data: any): Promise<APIResponse<{ id: string }>> => {
      return this.httpClient.post(`/data/${entity}`, data);
    },

    update: async (entity: string, id: string, data: any): Promise<APIResponse<any>> => {
      return this.httpClient.put(`/data/${entity}/${id}`, data);
    },

    delete: async (entity: string, id: string): Promise<APIResponse<void>> => {
      return this.httpClient.delete(`/data/${entity}/${id}`);
    },

    get: async (entity: string, id: string): Promise<APIResponse<any>> => {
      return this.httpClient.get(`/data/${entity}/${id}`);
    },

    list: async (entity: string, options?: {
      limit?: number;
      offset?: number;
      filters?: Record<string, any>;
      sort?: string;
    }): Promise<APIResponse<{ items: any[]; total: number }>> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sort) params.append('sort', options.sort);
      if (options?.filters) params.append('filters', JSON.stringify(options.filters));
      
      return this.httpClient.get(`/data/${entity}?${params.toString()}`);
    }
  };

  // Analytics & Reporting
  analytics = {
    createDashboard: async (config: {
      name: string;
      widgets: any[];
      layout?: string;
    }): Promise<APIResponse<{ dashboardId: string }>> => {
      return this.httpClient.post('/analytics/dashboards', config);
    },

    executeWidget: async (widgetId: string): Promise<APIResponse<{
      data: any[];
      metadata: any;
    }>> => {
      return this.httpClient.get(`/analytics/widgets/${widgetId}/execute`);
    },

    generateReport: async (dashboardId: string, format: string): Promise<APIResponse<{
      reportUrl: string;
    }>> => {
      return this.httpClient.post(`/analytics/dashboards/${dashboardId}/export`, { format });
    },

    getMetrics: async (metricIds: string[]): Promise<APIResponse<Array<{
      id: string;
      value: number;
      status: string;
    }>>> => {
      return this.httpClient.post('/analytics/metrics/batch', { metricIds });
    }
  };

  // Workflow Automation
  workflows = {
    create: async (workflow: {
      name: string;
      steps: any[];
      triggers: any[];
    }): Promise<APIResponse<{ workflowId: string }>> => {
      return this.httpClient.post('/workflows', workflow);
    },

    execute: async (workflowId: string, context?: any): Promise<APIResponse<{
      executionId: string;
      status: string;
    }>> => {
      return this.httpClient.post(`/workflows/${workflowId}/execute`, { context });
    },

    getExecution: async (executionId: string): Promise<APIResponse<{
      id: string;
      status: string;
      steps: any[];
    }>> => {
      return this.httpClient.get(`/workflows/executions/${executionId}`);
    }
  };

  // Real-time Features
  realtime = {
    connect: (options?: { channels?: string[] }): WebSocketConnection => {
      return new WebSocketConnection(this.config, options);
    },

    sendMessage: async (channelId: string, message: any): Promise<APIResponse<void>> => {
      return this.httpClient.post(`/realtime/channels/${channelId}/messages`, message);
    },

    createChannel: async (config: {
      name: string;
      type: 'public' | 'private';
      members?: string[];
    }): Promise<APIResponse<{ channelId: string }>> => {
      return this.httpClient.post('/realtime/channels', config);
    }
  };

  // User Management
  users = {
    create: async (user: {
      email: string;
      name: string;
      role: string;
      permissions?: string[];
    }): Promise<APIResponse<{ userId: string }>> => {
      return this.httpClient.post('/users', user);
    },

    get: async (userId: string): Promise<APIResponse<any>> => {
      return this.httpClient.get(`/users/${userId}`);
    },

    update: async (userId: string, updates: any): Promise<APIResponse<any>> => {
      return this.httpClient.put(`/users/${userId}`, updates);
    },

    list: async (options?: {
      role?: string;
      limit?: number;
      offset?: number;
    }): Promise<APIResponse<{ users: any[]; total: number }>> => {
      const params = new URLSearchParams();
      if (options?.role) params.append('role', options.role);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      return this.httpClient.get(`/users?${params.toString()}`);
    }
  };

  // Integrations
  integrations = {
    connect: async (type: string, config: any): Promise<APIResponse<{
      integrationId: string;
      status: string;
    }>> => {
      return this.httpClient.post('/integrations', { type, config });
    },

    sync: async (integrationId: string): Promise<APIResponse<{
      syncId: string;
      status: string;
    }>> => {
      return this.httpClient.post(`/integrations/${integrationId}/sync`);
    },

    getStatus: async (integrationId: string): Promise<APIResponse<{
      status: string;
      lastSync: string;
      errors?: string[];
    }>> => {
      return this.httpClient.get(`/integrations/${integrationId}/status`);
    }
  };

  // Utility Methods
  utils = {
    validateData: async (schema: any, data: any): Promise<APIResponse<{
      valid: boolean;
      errors?: string[];
    }>> => {
      return this.httpClient.post('/utils/validate', { schema, data });
    },

    generateId: (): string => {
      return crypto.randomUUID();
    },

    formatCurrency: (amount: number, currency = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    },

    formatDate: (date: string | Date, format = 'short'): string => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        dateStyle: format as any
      });
    }
  };
}

class HTTPClient {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  async get<T>(path: string): Promise<APIResponse<T>> {
    return this.request('GET', path);
  }

  async post<T>(path: string, data?: any): Promise<APIResponse<T>> {
    return this.request('POST', path, data);
  }

  async put<T>(path: string, data?: any): Promise<APIResponse<T>> {
    return this.request('PUT', path, data);
  }

  async delete<T>(path: string): Promise<APIResponse<T>> {
    return this.request('DELETE', path);
  }

  private async request<T>(method: string, path: string, data?: any): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}/api/${this.config.version}${path}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Tenant-ID': this.config.tenantId,
      'Content-Type': 'application/json'
    };

    try {
      // Mock HTTP request - in production, use actual fetch/axios
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      // Simulate success/failure
      if (Math.random() > 0.05) { // 95% success rate
        return {
          success: true,
          data: data || { message: `${method} ${path} successful` } as T,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            rateLimit: {
              remaining: Math.floor(Math.random() * 100),
              reset: new Date(Date.now() + 60000).toISOString()
            }
          }
        };
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

class WebSocketConnection {
  private ws: WebSocket | null = null;
  private config: SDKConfig;
  private options: any;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: SDKConfig, options: any = {}) {
    this.config = config;
    this.options = options;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.baseURL.replace('http', 'ws') + '/ws';
      this.ws = new WebSocket(`${wsUrl}?token=${this.config.apiKey}&tenant=${this.config.tenantId}`);

      this.ws.onopen = () => {
        if (this.options.channels) {
          this.options.channels.forEach((channel: string) => {
            this.subscribe(channel);
          });
        }
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onclose = () => {
        this.emit('disconnected');
      };
    });
  }

  subscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
  }

  unsubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export SDK factory function
export function createInfinitySDK(config: SDKConfig): InfinitySDK {
  return new InfinitySDK(config);
}

