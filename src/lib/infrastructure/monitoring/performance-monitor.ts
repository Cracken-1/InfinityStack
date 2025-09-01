export interface PerformanceMetric {
  timestamp: string;
  metricName: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  source: string;
}

export interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'resolved' | 'suppressed';
  triggeredAt: string;
  resolvedAt?: string;
  message: string;
  runbook?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    ai: ComponentHealth;
    storage: ComponentHealth;
  };
  lastUpdated: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: string;
}

export interface PerformanceInsight {
  type: 'bottleneck' | 'optimization' | 'anomaly' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: Map<string, Alert> = new Map();
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();
  private systemHealth: SystemHealth = {} as SystemHealth;

  constructor() {
    this.initializeThresholds();
    this.initializeSystemHealth();
    this.startMonitoring();
  }

  private initializeThresholds(): void {
    this.thresholds.set('response_time', { warning: 1000, critical: 5000 });
    this.thresholds.set('error_rate', { warning: 0.05, critical: 0.1 });
    this.thresholds.set('cpu_usage', { warning: 70, critical: 90 });
    this.thresholds.set('memory_usage', { warning: 80, critical: 95 });
    this.thresholds.set('disk_usage', { warning: 85, critical: 95 });
    this.thresholds.set('queue_length', { warning: 100, critical: 500 });
  }

  private initializeSystemHealth(): void {
    this.systemHealth = {
      overall: 'healthy',
      components: {
        api: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date().toISOString() },
        database: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date().toISOString() },
        cache: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date().toISOString() },
        ai: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date().toISOString() },
        storage: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date().toISOString() }
      },
      lastUpdated: new Date().toISOString()
    };
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(fullMetric);
    this.checkThresholds(fullMetric);
    this.updateSystemHealth(fullMetric);

    // Keep only last 24 hours of metrics
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.metricName);
    if (!threshold) return;

    let severity: Alert['severity'] | null = null;
    
    if (metric.value >= threshold.critical) {
      severity = 'critical';
    } else if (metric.value >= threshold.warning) {
      severity = 'warning';
    }

    if (severity) {
      this.createAlert({
        name: `High ${metric.metricName}`,
        condition: `${metric.metricName} >= ${severity === 'critical' ? threshold.critical : threshold.warning}`,
        threshold: severity === 'critical' ? threshold.critical : threshold.warning,
        severity,
        message: `${metric.metricName} is ${metric.value}${metric.unit}, exceeding ${severity} threshold`,
        runbook: this.getRunbook(metric.metricName)
      });
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'status' | 'triggeredAt'>): void {
    const alertId = `${alertData.name}_${Date.now()}`;
    
    const alert: Alert = {
      ...alertData,
      id: alertId,
      status: 'active',
      triggeredAt: new Date().toISOString()
    };

    this.alerts.set(alertId, alert);
    this.notifyAlert(alert);
  }

  private notifyAlert(alert: Alert): void {
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    
    // In production, integrate with notification systems
    // - Send to Slack/Teams
    // - Send email notifications
    // - Create PagerDuty incidents
    // - Update status page
  }

  private updateSystemHealth(metric: PerformanceMetric): void {
    const component = this.getComponentFromMetric(metric);
    if (!component) return;

    const componentHealth = this.systemHealth.components[component];
    
    // Update component metrics
    switch (metric.metricName) {
      case 'response_time':
        componentHealth.responseTime = metric.value;
        break;
      case 'error_rate':
        componentHealth.errorRate = metric.value;
        break;
    }

    // Determine component status
    componentHealth.status = this.calculateComponentStatus(componentHealth);
    componentHealth.lastCheck = new Date().toISOString();

    // Update overall system health
    this.systemHealth.overall = this.calculateOverallHealth();
    this.systemHealth.lastUpdated = new Date().toISOString();
  }

  private getComponentFromMetric(metric: PerformanceMetric): keyof SystemHealth['components'] | null {
    if (metric.tags.component) {
      return metric.tags.component as keyof SystemHealth['components'];
    }
    
    // Infer component from metric name or source
    if (metric.source.includes('api')) return 'api';
    if (metric.source.includes('database') || metric.source.includes('db')) return 'database';
    if (metric.source.includes('cache')) return 'cache';
    if (metric.source.includes('ai') || metric.source.includes('ml')) return 'ai';
    if (metric.source.includes('storage')) return 'storage';
    
    return null;
  }

  private calculateComponentStatus(component: ComponentHealth): ComponentHealth['status'] {
    if (component.errorRate > 0.1 || component.responseTime > 5000) {
      return 'critical';
    }
    
    if (component.errorRate > 0.05 || component.responseTime > 1000) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private calculateOverallHealth(): SystemHealth['overall'] {
    const components = Object.values(this.systemHealth.components);
    
    if (components.some(c => c.status === 'critical')) {
      return 'critical';
    }
    
    if (components.some(c => c.status === 'degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private getRunbook(metricName: string): string {
    const runbooks: Record<string, string> = {
      response_time: 'Check load balancer, scale up servers, optimize database queries',
      error_rate: 'Check application logs, verify dependencies, rollback if needed',
      cpu_usage: 'Scale up instances, optimize CPU-intensive operations',
      memory_usage: 'Check for memory leaks, scale up instances, optimize memory usage',
      disk_usage: 'Clean up logs, archive old data, add storage capacity',
      queue_length: 'Scale up workers, optimize processing, check for bottlenecks'
    };
    
    return runbooks[metricName] || 'Check system logs and contact on-call engineer';
  }

  async generateInsights(): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];
    const recentMetrics = this.getMetrics({ hours: 1 });

    // Analyze response time trends
    const responseTimeMetrics = recentMetrics.filter(m => m.metricName === 'response_time');
    if (responseTimeMetrics.length > 10) {
      const trend = this.analyzeTrend(responseTimeMetrics);
      if (trend.slope > 10) { // Response time increasing
        insights.push({
          type: 'trend',
          severity: 'medium',
          title: 'Response Time Increasing',
          description: `Response time has increased by ${trend.slope.toFixed(1)}ms over the last hour`,
          recommendation: 'Consider scaling up servers or optimizing slow queries',
          impact: 'User experience degradation',
          confidence: trend.confidence
        });
      }
    }

    // Detect bottlenecks
    const cpuMetrics = recentMetrics.filter(m => m.metricName === 'cpu_usage');
    const memoryMetrics = recentMetrics.filter(m => m.metricName === 'memory_usage');
    
    if (cpuMetrics.length > 0 && memoryMetrics.length > 0) {
      const avgCpu = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      
      if (avgCpu > 80 && avgMemory < 60) {
        insights.push({
          type: 'bottleneck',
          severity: 'high',
          title: 'CPU Bottleneck Detected',
          description: `High CPU usage (${avgCpu.toFixed(1)}%) with normal memory usage`,
          recommendation: 'Optimize CPU-intensive operations or scale horizontally',
          impact: 'Performance degradation and potential service interruption',
          confidence: 0.85
        });
      }
    }

    // Detect anomalies
    const anomalies = this.detectAnomalies(recentMetrics);
    anomalies.forEach(anomaly => {
      insights.push({
        type: 'anomaly',
        severity: 'medium',
        title: `Anomaly in ${anomaly.metricName}`,
        description: `Unusual pattern detected: ${anomaly.description}`,
        recommendation: 'Investigate recent changes or external factors',
        impact: 'Potential service instability',
        confidence: anomaly.confidence
      });
    });

    return insights.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private analyzeTrend(metrics: PerformanceMetric[]): { slope: number; confidence: number } {
    if (metrics.length < 2) return { slope: 0, confidence: 0 };

    const points = metrics.map((m, i) => ({ x: i, y: m.value }));
    
    // Simple linear regression
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p.x + (sumY - slope * sumX) / n;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, confidence: Math.max(0, rSquared) };
  }

  private detectAnomalies(metrics: PerformanceMetric[]): Array<{
    metricName: string;
    description: string;
    confidence: number;
  }> {
    const anomalies: Array<{ metricName: string; description: string; confidence: number }> = [];
    const metricGroups = this.groupMetricsByName(metrics);

    for (const [metricName, metricList] of Array.from(metricGroups.entries())) {
      if (metricList.length < 10) continue;

      const values = metricList.map(m => m.value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

      // Check for values outside 2 standard deviations
      const outliers = values.filter(v => Math.abs(v - mean) > 2 * stdDev);
      
      if (outliers.length > values.length * 0.1) { // More than 10% outliers
        anomalies.push({
          metricName,
          description: `${outliers.length} values outside normal range (mean: ${mean.toFixed(2)}, stddev: ${stdDev.toFixed(2)})`,
          confidence: Math.min(0.9, outliers.length / values.length * 2)
        });
      }
    }

    return anomalies;
  }

  private groupMetricsByName(metrics: PerformanceMetric[]): Map<string, PerformanceMetric[]> {
    const groups = new Map<string, PerformanceMetric[]>();
    
    metrics.forEach(metric => {
      const existing = groups.get(metric.metricName) || [];
      existing.push(metric);
      groups.set(metric.metricName, existing);
    });

    return groups;
  }

  private startMonitoring(): void {
    // Simulate system metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    // Check for alert resolution
    setInterval(() => {
      this.checkAlertResolution();
    }, 60000); // Every minute
  }

  private collectSystemMetrics(): void {
    // Simulate various system metrics
    const metrics = [
      { metricName: 'cpu_usage', value: 30 + Math.random() * 40, unit: '%', source: 'system' },
      { metricName: 'memory_usage', value: 40 + Math.random() * 30, unit: '%', source: 'system' },
      { metricName: 'disk_usage', value: 50 + Math.random() * 20, unit: '%', source: 'system' },
      { metricName: 'response_time', value: 100 + Math.random() * 200, unit: 'ms', source: 'api' },
      { metricName: 'error_rate', value: Math.random() * 0.02, unit: '%', source: 'api' },
      { metricName: 'queue_length', value: Math.floor(Math.random() * 50), unit: 'items', source: 'worker' }
    ];

    metrics.forEach(metric => {
      this.recordMetric({ ...metric, tags: {} });
    });
  }

  private checkAlertResolution(): void {
    for (const [alertId, alert] of Array.from(this.alerts.entries())) {
      if (alert.status !== 'active') continue;

      // Check if conditions are no longer met
      const recentMetrics = this.getMetrics({ minutes: 5 });
      const relevantMetrics = recentMetrics.filter(m => 
        alert.condition.includes(m.metricName)
      );

      if (relevantMetrics.length > 0) {
        const latestValue = relevantMetrics[relevantMetrics.length - 1].value;
        if (latestValue < alert.threshold) {
          alert.status = 'resolved';
          alert.resolvedAt = new Date().toISOString();
          console.log(`✅ RESOLVED: ${alert.name}`);
        }
      }
    }
  }

  getMetrics(filter: { 
    hours?: number; 
    minutes?: number; 
    metricName?: string; 
    source?: string 
  } = {}): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter.hours || filter.minutes) {
      const cutoff = new Date(Date.now() - (filter.hours || 0) * 60 * 60 * 1000 - (filter.minutes || 0) * 60 * 1000);
      filtered = filtered.filter(m => new Date(m.timestamp) > cutoff);
    }

    if (filter.metricName) {
      filtered = filtered.filter(m => m.metricName === filter.metricName);
    }

    if (filter.source) {
      filtered = filtered.filter(m => m.source === filter.source);
    }

    return filtered;
  }

  getSystemHealth(): SystemHealth {
    return this.systemHealth;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === 'active');
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  suppressAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'suppressed';
      return true;
    }
    return false;
  }
}