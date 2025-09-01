export interface ReportField {
  id: string;
  name: string;
  type: 'dimension' | 'metric';
  dataType: 'string' | 'number' | 'date' | 'boolean';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  dataModelId: string;
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy: string[];
  orderBy: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  chartType?: 'table' | 'line' | 'bar' | 'pie' | 'area';
  createdAt: string;
  updatedAt: string;
}

export interface ReportResult {
  data: any[];
  metadata: {
    totalRows: number;
    executionTime: number;
    generatedAt: string;
  };
}

export class ReportBuilder {
  private reports: Map<string, ReportConfig> = new Map();

  createReport(report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): ReportConfig {
    const newReport: ReportConfig = {
      ...report,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  async executeReport(reportId: string, additionalFilters?: ReportFilter[]): Promise<ReportResult> {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

    const startTime = Date.now();

    // Mock data execution - in production, query actual data warehouse
    let data = this.getMockData(report.dataModelId);

    // Apply filters
    const allFilters = [...report.filters, ...(additionalFilters || [])];
    data = this.applyFilters(data, allFilters);

    // Apply grouping and aggregation
    if (report.groupBy.length > 0) {
      data = this.applyGrouping(data, report);
    }

    // Apply sorting
    data = this.applySorting(data, report.orderBy);

    // Apply limit
    if (report.limit) {
      data = data.slice(0, report.limit);
    }

    const executionTime = Date.now() - startTime;

    return {
      data,
      metadata: {
        totalRows: data.length,
        executionTime,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private getMockData(dataModelId: string): any[] {
    // Mock data based on data model
    return [
      { date: '2024-01-01', product: 'Product A', sales: 100, revenue: 1000, region: 'North' },
      { date: '2024-01-01', product: 'Product B', sales: 150, revenue: 1500, region: 'South' },
      { date: '2024-01-02', product: 'Product A', sales: 120, revenue: 1200, region: 'North' },
      { date: '2024-01-02', product: 'Product B', sales: 180, revenue: 1800, region: 'South' },
      { date: '2024-01-03', product: 'Product A', sales: 90, revenue: 900, region: 'East' },
      { date: '2024-01-03', product: 'Product B', sales: 200, revenue: 2000, region: 'West' }
    ];
  }

  private applyFilters(data: any[], filters: ReportFilter[]): any[] {
    return data.filter(row => {
      return filters.every(filter => {
        const value = row[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'not_equals':
            return value !== filter.value;
          case 'greater_than':
            return value > filter.value;
          case 'less_than':
            return value < filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  private applyGrouping(data: any[], report: ReportConfig): any[] {
    const grouped = data.reduce((groups, row) => {
      const key = report.groupBy.map(field => row[field]).join('|');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
      return groups;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([key, rows]) => {
      const result: any = {};
      
      // Add dimension fields
      report.groupBy.forEach((field, index) => {
        result[field] = key.split('|')[index];
      });

      // Add aggregated metrics
      report.fields.filter(f => f.type === 'metric').forEach(field => {
        const values = (rows as any[]).map(row => row[field.id]).filter(v => v != null);
        
        switch (field.aggregation) {
          case 'sum':
            result[field.id] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[field.id] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            result[field.id] = values.length;
            break;
          case 'min':
            result[field.id] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result[field.id] = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            result[field.id] = values[0] || 0;
        }
      });

      return result;
    });
  }

  private applySorting(data: any[], orderBy: ReportConfig['orderBy']): any[] {
    return data.sort((a, b) => {
      for (const sort of orderBy) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  updateReport(reportId: string, updates: Partial<ReportConfig>): ReportConfig | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.reports.set(reportId, updatedReport);
    return updatedReport;
  }

  getReports(tenantId: string): ReportConfig[] {
    return Array.from(this.reports.values()).filter(r => r.tenantId === tenantId);
  }

  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  exportReport(reportId: string, format: 'csv' | 'json' | 'excel'): Promise<string> {
    // Mock export functionality
    return Promise.resolve(`Report exported as ${format}`);
  }
}