export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'gauge' | 'funnel' | 'heatmap';
  title: string;
  dataSource: string;
  query: string;
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    groupBy?: string[];
    filters?: Array<{ field: string; operator: string; value: any }>;
    timeRange?: { start: string; end: string; granularity: string };
  };
  layout: { x: number; y: number; w: number; h: number };
  refreshInterval: number;
  tenantId: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'free' | 'tabs';
  permissions: {
    viewers: string[];
    editors: string[];
    public: boolean;
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  dashboardId: string;
  schedule: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  filters?: Record<string, any>;
  enabled: boolean;
  tenantId: string;
}

export interface BusinessMetric {
  id: string;
  name: string;
  formula: string;
  description: string;
  category: string;
  unit: string;
  target?: number;
  thresholds: {
    good: number;
    warning: number;
    critical: number;
  };
  tenantId: string;
}

export class DashboardBuilder {
  private dashboards: Map<string, Dashboard> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private dataCache: Map<string, { data: any; timestamp: string; ttl: number }> = new Map();

  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    const newDashboard: Dashboard = {
      ...dashboard,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dashboards.set(newDashboard.id, newDashboard);
    return newDashboard;
  }

  addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    const newWidget: DashboardWidget = {
      ...widget,
      id: crypto.randomUUID()
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date().toISOString();
    this.widgets.set(newWidget.id, newWidget);

    return newWidget;
  }

  async executeWidget(widgetId: string): Promise<{
    data: any[];
    metadata: {
      executionTime: number;
      recordCount: number;
      cacheHit: boolean;
    };
  }> {
    const widget = this.widgets.get(widgetId);
    if (!widget) throw new Error('Widget not found');

    const cacheKey = `${widgetId}_${JSON.stringify(widget.config)}`;
    const cached = this.dataCache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < cached.ttl) {
      return {
        data: cached.data,
        metadata: {
          executionTime: 0,
          recordCount: cached.data.length,
          cacheHit: true
        }
      };
    }

    const startTime = Date.now();
    const data = await this.executeQuery(widget.dataSource, widget.query, widget.config);
    const executionTime = Date.now() - startTime;

    // Cache result
    this.dataCache.set(cacheKey, {
      data,
      timestamp: new Date().toISOString(),
      ttl: widget.refreshInterval * 1000
    });

    return {
      data,
      metadata: {
        executionTime,
        recordCount: data.length,
        cacheHit: false
      }
    };
  }

  private async executeQuery(dataSource: string, query: string, config: DashboardWidget['config']): Promise<any[]> {
    // Mock data execution - in production, connect to actual data sources
    let mockData = this.generateMockData(dataSource, config);

    // Apply filters
    if (config.filters) {
      mockData = this.applyFilters(mockData, config.filters);
    }

    // Apply time range
    if (config.timeRange) {
      mockData = this.applyTimeRange(mockData, config.timeRange);
    }

    // Apply grouping and aggregation
    if (config.groupBy && config.aggregation) {
      mockData = this.applyAggregation(mockData, config.groupBy, config.aggregation);
    }

    return mockData;
  }

  private generateMockData(dataSource: string, config: any): any[] {
    switch (dataSource) {
      case 'sales':
        return Array.from({ length: 100 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 1000) + 100,
          product: ['Product A', 'Product B', 'Product C'][Math.floor(Math.random() * 3)],
          region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
          customer_id: Math.floor(Math.random() * 1000) + 1
        }));
      
      case 'users':
        return Array.from({ length: 50 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          active_users: Math.floor(Math.random() * 500) + 100,
          new_users: Math.floor(Math.random() * 50) + 10,
          sessions: Math.floor(Math.random() * 1000) + 200,
          bounce_rate: Math.random() * 0.5 + 0.2
        }));
      
      default:
        return [];
    }
  }

  private applyFilters(data: any[], filters: Array<{ field: string; operator: string; value: any }>): any[] {
    return data.filter(record => {
      return filters.every(filter => {
        const value = record[filter.field];
        switch (filter.operator) {
          case 'equals': return value === filter.value;
          case 'not_equals': return value !== filter.value;
          case 'greater_than': return value > filter.value;
          case 'less_than': return value < filter.value;
          case 'contains': return String(value).includes(filter.value);
          case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
          default: return true;
        }
      });
    });
  }

  private applyTimeRange(data: any[], timeRange: { start: string; end: string; granularity: string }): any[] {
    return data.filter(record => {
      const recordDate = new Date(record.date || record.timestamp);
      const startDate = new Date(timeRange.start);
      const endDate = new Date(timeRange.end);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  private applyAggregation(data: any[], groupBy: string[], aggregation: string): any[] {
    const grouped = data.reduce((groups, record) => {
      const key = groupBy.map(field => record[field]).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
      return groups;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([key, records]) => {
      const result: any = {};
      
      // Add group by fields
      groupBy.forEach((field, index) => {
        result[field] = key.split('|')[index];
      });

      // Add aggregated value
      const numericFields = Object.keys((records as any[])[0]).filter(field => 
        typeof (records as any[])[0][field] === 'number'
      );

      numericFields.forEach(field => {
        const values = (records as any[]).map(r => r[field]).filter(v => typeof v === 'number');
        
        switch (aggregation) {
          case 'sum':
            result[`${field}_sum`] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[`${field}_avg`] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'count':
            result[`${field}_count`] = values.length;
            break;
          case 'min':
            result[`${field}_min`] = Math.min(...values);
            break;
          case 'max':
            result[`${field}_max`] = Math.max(...values);
            break;
        }
      });

      return result;
    });
  }

  createScheduledReport(report: Omit<ScheduledReport, 'id'>): ScheduledReport {
    const newReport: ScheduledReport = {
      ...report,
      id: crypto.randomUUID()
    };

    this.scheduledReports.set(newReport.id, newReport);
    this.scheduleReport(newReport);
    return newReport;
  }

  private scheduleReport(report: ScheduledReport): void {
    // Mock report scheduling - in production, use proper cron scheduler
    const interval = this.parseCronToInterval(report.schedule);
    
    setInterval(async () => {
      if (report.enabled) {
        await this.generateAndSendReport(report);
      }
    }, interval);
  }

  private async generateAndSendReport(report: ScheduledReport): Promise<void> {
    const dashboard = this.dashboards.get(report.dashboardId);
    if (!dashboard) return;

    console.log(`Generating ${report.format} report for dashboard: ${dashboard.name}`);
    
    // Generate report data
    const reportData = await this.generateReportData(dashboard, report.filters);
    
    // Send to recipients
    for (const recipient of report.recipients) {
      console.log(`Sending report to: ${recipient}`);
      // In production, send actual email with attachment
    }
  }

  private async generateReportData(dashboard: Dashboard, filters?: Record<string, any>): Promise<any> {
    const widgetData = await Promise.all(
      dashboard.widgets.map(async widget => {
        const result = await this.executeWidget(widget.id);
        return {
          widget: widget.title,
          type: widget.type,
          data: result.data
        };
      })
    );

    return {
      dashboard: dashboard.name,
      generatedAt: new Date().toISOString(),
      widgets: widgetData
    };
  }

  defineBusinessMetric(metric: Omit<BusinessMetric, 'id'>): BusinessMetric {
    const newMetric: BusinessMetric = {
      ...metric,
      id: crypto.randomUUID()
    };

    this.businessMetrics.set(newMetric.id, newMetric);
    return newMetric;
  }

  async calculateBusinessMetric(metricId: string): Promise<{
    value: number;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
  }> {
    const metric = this.businessMetrics.get(metricId);
    if (!metric) throw new Error('Metric not found');

    // Mock metric calculation - in production, execute actual formula
    const value = Math.random() * 100;
    
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (value <= metric.thresholds.critical) status = 'critical';
    else if (value <= metric.thresholds.warning) status = 'warning';

    const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';

    return { value, status, trend };
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing
    if (cron === '0 9 * * *') return 24 * 60 * 60 * 1000; // Daily at 9 AM
    if (cron === '0 9 * * 1') return 7 * 24 * 60 * 60 * 1000; // Weekly on Monday
    if (cron === '0 9 1 * *') return 30 * 24 * 60 * 60 * 1000; // Monthly on 1st
    return 24 * 60 * 60 * 1000; // Default daily
  }

  getDashboards(tenantId: string): Dashboard[] {
    return Array.from(this.dashboards.values()).filter(d => d.tenantId === tenantId);
  }

  getScheduledReports(tenantId: string): ScheduledReport[] {
    return Array.from(this.scheduledReports.values()).filter(r => r.tenantId === tenantId);
  }

  getBusinessMetrics(tenantId: string): BusinessMetric[] {
    return Array.from(this.businessMetrics.values()).filter(m => m.tenantId === tenantId);
  }

  async exportDashboard(dashboardId: string, format: 'json' | 'pdf' | 'excel'): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    const reportData = await this.generateReportData(dashboard);
    
    // Mock export - in production, generate actual files
    return `dashboard_${dashboardId}_${Date.now()}.${format}`;
  }

  cloneDashboard(dashboardId: string, newName: string): Dashboard {
    const original = this.dashboards.get(dashboardId);
    if (!original) throw new Error('Dashboard not found');

    const cloned: Dashboard = {
      ...original,
      id: crypto.randomUUID(),
      name: newName,
      widgets: original.widgets.map(widget => ({
        ...widget,
        id: crypto.randomUUID()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dashboards.set(cloned.id, cloned);
    return cloned;
  }
}