export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'webhook';
  config: Record<string, any>;
  tenantId: string;
  lastSync?: string;
}

export interface DataModel {
  id: string;
  name: string;
  sourceId: string;
  schema: Record<string, any>;
  transformations: DataTransformation[];
  tenantId: string;
}

export interface DataTransformation {
  id: string;
  type: 'filter' | 'aggregate' | 'join' | 'calculate';
  config: Record<string, any>;
}

export class DataWarehouse {
  private sources: Map<string, DataSource> = new Map();
  private models: Map<string, DataModel> = new Map();
  private data: Map<string, any[]> = new Map();

  addDataSource(source: Omit<DataSource, 'id'>): DataSource {
    const newSource: DataSource = {
      ...source,
      id: crypto.randomUUID()
    };

    this.sources.set(newSource.id, newSource);
    return newSource;
  }

  createDataModel(model: Omit<DataModel, 'id'>): DataModel {
    const newModel: DataModel = {
      ...model,
      id: crypto.randomUUID()
    };

    this.models.set(newModel.id, newModel);
    return newModel;
  }

  async syncDataSource(sourceId: string): Promise<any[]> {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error('Data source not found');

    let data: any[] = [];

    switch (source.type) {
      case 'database':
        data = await this.syncDatabase(source.config);
        break;
      case 'api':
        data = await this.syncApi(source.config);
        break;
      case 'file':
        data = await this.syncFile(source.config);
        break;
    }

    this.data.set(sourceId, data);
    source.lastSync = new Date().toISOString();

    return data;
  }

  async queryData(modelId: string, filters?: Record<string, any>): Promise<any[]> {
    const model = this.models.get(modelId);
    if (!model) throw new Error('Data model not found');

    let data = this.data.get(model.sourceId) || [];

    // Apply transformations
    for (const transformation of model.transformations) {
      data = this.applyTransformation(data, transformation);
    }

    // Apply filters
    if (filters) {
      data = data.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(row[key]);
          }
          return row[key] === value;
        });
      });
    }

    return data;
  }

  private async syncDatabase(config: any): Promise<any[]> {
    // Mock database sync
    console.log('Syncing database:', config.connectionString);
    return [
      { id: 1, name: 'Product A', sales: 100, date: '2024-01-01' },
      { id: 2, name: 'Product B', sales: 150, date: '2024-01-02' }
    ];
  }

  private async syncApi(config: any): Promise<any[]> {
    // Mock API sync
    console.log('Syncing API:', config.endpoint);
    return [
      { userId: 1, action: 'login', timestamp: '2024-01-01T10:00:00Z' },
      { userId: 2, action: 'purchase', timestamp: '2024-01-01T11:00:00Z' }
    ];
  }

  private async syncFile(config: any): Promise<any[]> {
    // Mock file sync
    console.log('Syncing file:', config.filePath);
    return [
      { customer: 'John Doe', revenue: 500, region: 'North' },
      { customer: 'Jane Smith', revenue: 750, region: 'South' }
    ];
  }

  private applyTransformation(data: any[], transformation: DataTransformation): any[] {
    switch (transformation.type) {
      case 'filter':
        return data.filter(row => {
          const { field, operator, value } = transformation.config;
          switch (operator) {
            case 'equals': return row[field] === value;
            case 'greater_than': return row[field] > value;
            case 'contains': return String(row[field]).includes(value);
            default: return true;
          }
        });

      case 'aggregate':
        const { groupBy, aggregations } = transformation.config;
        const grouped = this.groupBy(data, groupBy);
        return Object.entries(grouped).map(([key, rows]) => {
          const result: any = { [groupBy]: key };
          aggregations.forEach((agg: any) => {
            const values = (rows as any[]).map(row => row[agg.field]);
            switch (agg.function) {
              case 'sum':
                result[agg.alias] = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
                result[agg.alias] = values.reduce((a, b) => a + b, 0) / values.length;
                break;
              case 'count':
                result[agg.alias] = values.length;
                break;
            }
          });
          return result;
        });

      case 'calculate':
        return data.map(row => ({
          ...row,
          [transformation.config.field]: this.evaluateExpression(
            transformation.config.expression, 
            row
          )
        }));

      default:
        return data;
    }
  }

  private groupBy(data: any[], field: string): Record<string, any[]> {
    return data.reduce((groups, item) => {
      const key = item[field];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  private evaluateExpression(expression: string, row: any): any {
    // Simple expression evaluator
    try {
      return Function(...Object.keys(row), `return ${expression}`)(...Object.values(row));
    } catch {
      return null;
    }
  }

  getDataSources(tenantId: string): DataSource[] {
    return Array.from(this.sources.values()).filter(s => s.tenantId === tenantId);
  }

  getDataModels(tenantId: string): DataModel[] {
    return Array.from(this.models.values()).filter(m => m.tenantId === tenantId);
  }
}