export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream' | 'webhook';
  config: Record<string, any>;
  schedule?: string;
  enabled: boolean;
  tenantId: string;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'validate' | 'enrich';
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
}

export interface DataPipeline {
  id: string;
  name: string;
  sourceId: string;
  transformations: DataTransformation[];
  destination: {
    type: 'database' | 'api' | 'file' | 'stream';
    config: Record<string, any>;
  };
  schedule: string;
  status: 'active' | 'paused' | 'error';
  tenantId: string;
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  errors: string[];
  metrics: {
    throughput: number;
    errorRate: number;
    duration: number;
  };
}

export class ETLEngine {
  private dataSources: Map<string, DataSource> = new Map();
  private pipelines: Map<string, DataPipeline> = new Map();
  private executions: Map<string, PipelineExecution> = new Map();
  private streamProcessors: Map<string, any> = new Map();

  registerDataSource(source: Omit<DataSource, 'id'>): DataSource {
    const newSource: DataSource = {
      ...source,
      id: crypto.randomUUID()
    };

    this.dataSources.set(newSource.id, newSource);
    
    if (source.type === 'stream') {
      this.setupStreamProcessor(newSource);
    }

    return newSource;
  }

  createPipeline(pipeline: Omit<DataPipeline, 'id'>): DataPipeline {
    const newPipeline: DataPipeline = {
      ...pipeline,
      id: crypto.randomUUID()
    };

    this.pipelines.set(newPipeline.id, newPipeline);
    
    if (pipeline.schedule) {
      this.schedulePipeline(newPipeline);
    }

    return newPipeline;
  }

  async executePipeline(pipelineId: string): Promise<PipelineExecution> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const execution: PipelineExecution = {
      id: crypto.randomUUID(),
      pipelineId,
      status: 'running',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      errors: [],
      metrics: { throughput: 0, errorRate: 0, duration: 0 }
    };

    this.executions.set(execution.id, execution);

    try {
      // Extract data from source
      const sourceData = await this.extractData(pipeline.sourceId);
      
      // Apply transformations
      let transformedData = sourceData;
      for (const transformation of pipeline.transformations) {
        transformedData = await this.applyTransformation(transformedData, transformation);
      }

      // Load data to destination
      await this.loadData(transformedData, pipeline.destination);

      execution.status = 'completed';
      execution.recordsProcessed = transformedData.length;
      execution.endTime = new Date().toISOString();
      
      const duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
      execution.metrics = {
        throughput: execution.recordsProcessed / (duration / 1000),
        errorRate: execution.errors.length / execution.recordsProcessed,
        duration
      };

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      execution.endTime = new Date().toISOString();
    }

    return execution;
  }

  private async extractData(sourceId: string): Promise<any[]> {
    const source = this.dataSources.get(sourceId);
    if (!source) throw new Error('Data source not found');

    switch (source.type) {
      case 'database':
        return this.extractFromDatabase(source.config);
      case 'api':
        return this.extractFromAPI(source.config);
      case 'file':
        return this.extractFromFile(source.config);
      case 'stream':
        return this.extractFromStream(source.config);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async extractFromDatabase(config: any): Promise<any[]> {
    // Mock database extraction
    return [
      { id: 1, name: 'Product A', price: 100, category: 'Electronics' },
      { id: 2, name: 'Product B', price: 200, category: 'Clothing' }
    ];
  }

  private async extractFromAPI(config: any): Promise<any[]> {
    // Mock API extraction
    return [
      { userId: 1, action: 'login', timestamp: new Date().toISOString() },
      { userId: 2, action: 'purchase', timestamp: new Date().toISOString() }
    ];
  }

  private async extractFromFile(config: any): Promise<any[]> {
    // Mock file extraction (CSV, JSON, etc.)
    return [
      { customer: 'John Doe', order: 1001, amount: 150 },
      { customer: 'Jane Smith', order: 1002, amount: 250 }
    ];
  }

  private async extractFromStream(config: any): Promise<any[]> {
    // Mock stream extraction
    return [
      { event: 'page_view', url: '/products', userId: 123 },
      { event: 'click', element: 'buy_button', userId: 456 }
    ];
  }

  private async applyTransformation(data: any[], transformation: DataTransformation): Promise<any[]> {
    switch (transformation.type) {
      case 'map':
        return this.mapTransformation(data, transformation.config);
      case 'filter':
        return this.filterTransformation(data, transformation.config);
      case 'aggregate':
        return this.aggregateTransformation(data, transformation.config);
      case 'validate':
        return this.validateTransformation(data, transformation.config);
      case 'enrich':
        return this.enrichTransformation(data, transformation.config);
      default:
        return data;
    }
  }

  private mapTransformation(data: any[], config: any): any[] {
    return data.map(record => {
      const mapped: any = {};
      for (const [sourceField, targetField] of Object.entries(config.mapping)) {
        mapped[targetField as string] = record[sourceField];
      }
      return mapped;
    });
  }

  private filterTransformation(data: any[], config: any): any[] {
    return data.filter(record => {
      for (const condition of config.conditions) {
        const value = record[condition.field];
        switch (condition.operator) {
          case 'equals':
            if (value !== condition.value) return false;
            break;
          case 'greater_than':
            if (value <= condition.value) return false;
            break;
          case 'contains':
            if (!String(value).includes(condition.value)) return false;
            break;
        }
      }
      return true;
    });
  }

  private aggregateTransformation(data: any[], config: any): any[] {
    const grouped = data.reduce((groups, record) => {
      const key = config.groupBy.map((field: string) => record[field]).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
      return groups;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([key, records]) => {
      const result: any = {};
      
      // Add group by fields
      config.groupBy.forEach((field: string, index: number) => {
        result[field] = key.split('|')[index];
      });

      // Add aggregations
      config.aggregations.forEach((agg: any) => {
        const values = (records as any[]).map(r => r[agg.field]).filter(v => v != null);
        switch (agg.function) {
          case 'sum':
            result[agg.alias] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[agg.alias] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'count':
            result[agg.alias] = values.length;
            break;
          case 'max':
            result[agg.alias] = Math.max(...values);
            break;
          case 'min':
            result[agg.alias] = Math.min(...values);
            break;
        }
      });

      return result;
    });
  }

  private validateTransformation(data: any[], config: any): any[] {
    return data.filter(record => {
      for (const rule of config.rules) {
        const value = record[rule.field];
        
        switch (rule.type) {
          case 'required':
            if (value == null || value === '') return false;
            break;
          case 'type':
            if (typeof value !== rule.expectedType) return false;
            break;
          case 'range':
            if (value < rule.min || value > rule.max) return false;
            break;
          case 'regex':
            if (!new RegExp(rule.pattern).test(String(value))) return false;
            break;
        }
      }
      return true;
    });
  }

  private async enrichTransformation(data: any[], config: any): Promise<any[]> {
    // Mock data enrichment (e.g., adding geolocation, user details, etc.)
    return data.map(record => ({
      ...record,
      enriched_at: new Date().toISOString(),
      enriched_data: { source: 'external_api', confidence: 0.95 }
    }));
  }

  private async loadData(data: any[], destination: DataPipeline['destination']): Promise<void> {
    switch (destination.type) {
      case 'database':
        await this.loadToDatabase(data, destination.config);
        break;
      case 'api':
        await this.loadToAPI(data, destination.config);
        break;
      case 'file':
        await this.loadToFile(data, destination.config);
        break;
      case 'stream':
        await this.loadToStream(data, destination.config);
        break;
    }
  }

  private async loadToDatabase(data: any[], config: any): Promise<void> {
    console.log(`Loading ${data.length} records to database table: ${config.table}`);
  }

  private async loadToAPI(data: any[], config: any): Promise<void> {
    console.log(`Sending ${data.length} records to API: ${config.endpoint}`);
  }

  private async loadToFile(data: any[], config: any): Promise<void> {
    console.log(`Writing ${data.length} records to file: ${config.path}`);
  }

  private async loadToStream(data: any[], config: any): Promise<void> {
    console.log(`Publishing ${data.length} records to stream: ${config.topic}`);
  }

  private setupStreamProcessor(source: DataSource): void {
    // Mock stream processor setup
    const processor = {
      id: source.id,
      process: (event: any) => {
        console.log(`Processing stream event:`, event);
        // Trigger real-time pipeline execution
        this.processStreamEvent(source.id, event);
      }
    };

    this.streamProcessors.set(source.id, processor);
  }

  private async processStreamEvent(sourceId: string, event: any): Promise<void> {
    // Find pipelines that use this stream source
    const relevantPipelines = Array.from(this.pipelines.values())
      .filter(p => p.sourceId === sourceId && p.status === 'active');

    for (const pipeline of relevantPipelines) {
      // Process single event through pipeline
      let transformedData = [event];
      
      for (const transformation of pipeline.transformations) {
        transformedData = await this.applyTransformation(transformedData, transformation);
      }

      await this.loadData(transformedData, pipeline.destination);
    }
  }

  private schedulePipeline(pipeline: DataPipeline): void {
    // Mock pipeline scheduling - in production, use proper cron scheduler
    const interval = this.parseCronToInterval(pipeline.schedule);
    
    setInterval(() => {
      if (pipeline.status === 'active') {
        this.executePipeline(pipeline.id);
      }
    }, interval);
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing
    if (cron === '0 * * * *') return 60 * 60 * 1000; // Hourly
    if (cron === '0 0 * * *') return 24 * 60 * 60 * 1000; // Daily
    if (cron === '*/15 * * * *') return 15 * 60 * 1000; // Every 15 minutes
    return 60 * 60 * 1000; // Default hourly
  }

  getDataSources(tenantId: string): DataSource[] {
    return Array.from(this.dataSources.values()).filter(s => s.tenantId === tenantId);
  }

  getPipelines(tenantId: string): DataPipeline[] {
    return Array.from(this.pipelines.values()).filter(p => p.tenantId === tenantId);
  }

  getPipelineExecutions(pipelineId: string): PipelineExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.pipelineId === pipelineId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getExecutionMetrics(): {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    totalRecordsProcessed: number;
  } {
    const executions = Array.from(this.executions.values());
    const successful = executions.filter(e => e.status === 'completed');
    
    return {
      totalExecutions: executions.length,
      successRate: successful.length / executions.length,
      avgDuration: successful.reduce((sum, e) => sum + e.metrics.duration, 0) / successful.length,
      totalRecordsProcessed: executions.reduce((sum, e) => sum + e.recordsProcessed, 0)
    };
  }
}