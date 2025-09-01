export interface AuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogger {
  private logs: AuditLog[] = [];

  log(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const auditLog: AuditLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.logs.push(auditLog);
    
    // In production, save to database
    console.log('Audit Log:', auditLog);
    
    return auditLog;
  }

  getLogs(tenantId: string, filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
  }) {
    let filteredLogs = this.logs.filter(log => log.tenantId === tenantId);

    if (filters) {
      if (filters.userId) filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      if (filters.action) filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!));
      if (filters.resource) filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
      if (filters.severity) filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      if (filters.startDate) filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      if (filters.endDate) filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Common audit actions
  static ACTIONS = {
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
    CREATE: 'resource.create',
    UPDATE: 'resource.update',
    DELETE: 'resource.delete',
    VIEW: 'resource.view',
    EXPORT: 'data.export',
    IMPORT: 'data.import',
    PERMISSION_CHANGE: 'permission.change',
    SETTINGS_UPDATE: 'settings.update'
  };
}