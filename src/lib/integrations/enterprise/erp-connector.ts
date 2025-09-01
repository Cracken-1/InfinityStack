export interface ERPSystem {
  id: string;
  name: string;
  type: 'sap' | 'oracle' | 'netsuite' | 'dynamics' | 'quickbooks' | 'xero';
  config: {
    endpoint: string;
    credentials: Record<string, string>;
    version: string;
    modules: string[];
  };
  status: 'connected' | 'disconnected' | 'error';
  tenantId: string;
  lastSync: string;
}

export interface SyncMapping {
  id: string;
  erpSystemId: string;
  sourceEntity: string;
  targetEntity: string;
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
  }>;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  schedule: string;
  enabled: boolean;
}

export interface SyncExecution {
  id: string;
  mappingId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: string[];
}

export class ERPConnector {
  private systems: Map<string, ERPSystem> = new Map();
  private mappings: Map<string, SyncMapping> = new Map();
  private executions: Map<string, SyncExecution> = new Map();

  registerERPSystem(system: Omit<ERPSystem, 'id' | 'status' | 'lastSync'>): ERPSystem {
    const newSystem: ERPSystem = {
      ...system,
      id: crypto.randomUUID(),
      status: 'disconnected',
      lastSync: new Date().toISOString()
    };

    this.systems.set(newSystem.id, newSystem);
    return newSystem;
  }

  async testConnection(systemId: string): Promise<{
    success: boolean;
    latency: number;
    version?: string;
    modules?: string[];
    error?: string;
  }> {
    const system = this.systems.get(systemId);
    if (!system) throw new Error('ERP system not found');

    const startTime = Date.now();

    try {
      // Mock connection test based on ERP type
      const result = await this.performConnectionTest(system);
      
      if (result.success) {
        system.status = 'connected';
        system.lastSync = new Date().toISOString();
      }

      return {
        ...result,
        latency: Date.now() - startTime
      };
    } catch (error) {
      system.status = 'error';
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private async performConnectionTest(system: ERPSystem): Promise<{
    success: boolean;
    version?: string;
    modules?: string[];
  }> {
    // Mock connection tests for different ERP systems
    switch (system.type) {
      case 'sap':
        return {
          success: true,
          version: 'S/4HANA 2021',
          modules: ['FI', 'CO', 'SD', 'MM', 'PP']
        };
      
      case 'oracle':
        return {
          success: true,
          version: 'Oracle ERP Cloud 22C',
          modules: ['Financials', 'Procurement', 'Project Management']
        };
      
      case 'netsuite':
        return {
          success: true,
          version: '2023.1',
          modules: ['CRM', 'ERP', 'Ecommerce']
        };
      
      case 'quickbooks':
        return {
          success: true,
          version: 'QuickBooks Online',
          modules: ['Accounting', 'Payroll', 'Payments']
        };
      
      default:
        return { success: Math.random() > 0.1 }; // 90% success rate
    }
  }

  createSyncMapping(mapping: Omit<SyncMapping, 'id'>): SyncMapping {
    const newMapping: SyncMapping = {
      ...mapping,
      id: crypto.randomUUID()
    };

    this.mappings.set(newMapping.id, newMapping);
    
    if (mapping.schedule) {
      this.scheduleSync(newMapping);
    }

    return newMapping;
  }

  async executeSync(mappingId: string): Promise<SyncExecution> {
    const mapping = this.mappings.get(mappingId);
    if (!mapping) throw new Error('Sync mapping not found');

    const system = this.systems.get(mapping.erpSystemId);
    if (!system || system.status !== 'connected') {
      throw new Error('ERP system not connected');
    }

    const execution: SyncExecution = {
      id: crypto.randomUUID(),
      mappingId,
      status: 'running',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      errors: []
    };

    this.executions.set(execution.id, execution);

    try {
      // Extract data from source
      const sourceData = await this.extractData(system, mapping.sourceEntity);
      
      // Transform data according to field mappings
      const transformedData = this.transformData(sourceData, mapping.fieldMappings);
      
      // Load data to target
      const results = await this.loadData(transformedData, mapping.targetEntity, mapping.syncDirection);

      execution.status = 'completed';
      execution.recordsProcessed = sourceData.length;
      execution.recordsSuccess = results.success;
      execution.recordsFailed = results.failed;
      execution.errors = results.errors;
      execution.endTime = new Date().toISOString();

      // Update system last sync
      system.lastSync = execution.endTime;

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error instanceof Error ? error.message : 'Sync failed');
      execution.endTime = new Date().toISOString();
    }

    return execution;
  }

  private async extractData(system: ERPSystem, entity: string): Promise<any[]> {
    // Mock data extraction based on ERP type and entity
    switch (system.type) {
      case 'sap':
        return this.extractSAPData(entity, system.config);
      case 'oracle':
        return this.extractOracleData(entity, system.config);
      case 'quickbooks':
        return this.extractQuickBooksData(entity, system.config);
      default:
        return this.extractGenericData(entity);
    }
  }

  private async extractSAPData(entity: string, config: any): Promise<any[]> {
    // Mock SAP data extraction
    switch (entity) {
      case 'customers':
        return [
          { KUNNR: '1001', NAME1: 'Acme Corp', LAND1: 'US', ORT01: 'New York' },
          { KUNNR: '1002', NAME1: 'Tech Solutions', LAND1: 'CA', ORT01: 'Toronto' }
        ];
      case 'materials':
        return [
          { MATNR: 'MAT001', MAKTX: 'Product A', MEINS: 'EA', MTART: 'FERT' },
          { MATNR: 'MAT002', MAKTX: 'Product B', MEINS: 'EA', MTART: 'FERT' }
        ];
      default:
        return [];
    }
  }

  private async extractOracleData(entity: string, config: any): Promise<any[]> {
    // Mock Oracle data extraction
    switch (entity) {
      case 'suppliers':
        return [
          { VENDOR_ID: 'V001', VENDOR_NAME: 'Supplier One', STATUS: 'ACTIVE' },
          { VENDOR_ID: 'V002', VENDOR_NAME: 'Supplier Two', STATUS: 'ACTIVE' }
        ];
      default:
        return [];
    }
  }

  private async extractQuickBooksData(entity: string, config: any): Promise<any[]> {
    // Mock QuickBooks data extraction
    switch (entity) {
      case 'items':
        return [
          { Id: '1', Name: 'Service Item', Type: 'Service', UnitPrice: 100 },
          { Id: '2', Name: 'Inventory Item', Type: 'Inventory', QtyOnHand: 50 }
        ];
      default:
        return [];
    }
  }

  private extractGenericData(entity: string): any[] {
    // Generic mock data
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `${entity} ${i + 1}`,
      status: 'active',
      created_date: new Date().toISOString()
    }));
  }

  private transformData(data: any[], fieldMappings: SyncMapping['fieldMappings']): any[] {
    return data.map(record => {
      const transformed: any = {};
      
      fieldMappings.forEach(mapping => {
        let value = record[mapping.sourceField];
        
        // Apply transformation if specified
        if (mapping.transformation) {
          value = this.applyTransformation(value, mapping.transformation);
        }
        
        transformed[mapping.targetField] = value;
      });
      
      return transformed;
    });
  }

  private applyTransformation(value: any, transformation: string): any {
    switch (transformation) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'date_format':
        return new Date(value).toISOString().split('T')[0];
      case 'currency_convert':
        return Number(value) * 1.1; // Mock currency conversion
      default:
        return value;
    }
  }

  private async loadData(data: any[], targetEntity: string, direction: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    // Mock data loading
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const record of data) {
      try {
        // Simulate loading with 95% success rate
        if (Math.random() > 0.05) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to load record: ${JSON.stringify(record)}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return results;
  }

  private scheduleSync(mapping: SyncMapping): void {
    // Mock sync scheduling
    const interval = this.parseCronToInterval(mapping.schedule);
    
    setInterval(() => {
      if (mapping.enabled) {
        this.executeSync(mapping.id);
      }
    }, interval);
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing
    if (cron === '0 */4 * * *') return 4 * 60 * 60 * 1000; // Every 4 hours
    if (cron === '0 0 * * *') return 24 * 60 * 60 * 1000; // Daily
    if (cron === '0 0 * * 0') return 7 * 24 * 60 * 60 * 1000; // Weekly
    return 60 * 60 * 1000; // Default hourly
  }

  async getERPEntities(systemId: string): Promise<Array<{
    name: string;
    description: string;
    fields: Array<{ name: string; type: string; required: boolean }>;
  }>> {
    const system = this.systems.get(systemId);
    if (!system) throw new Error('ERP system not found');

    // Mock entity discovery based on ERP type
    switch (system.type) {
      case 'sap':
        return [
          {
            name: 'customers',
            description: 'Customer Master Data',
            fields: [
              { name: 'KUNNR', type: 'string', required: true },
              { name: 'NAME1', type: 'string', required: true },
              { name: 'LAND1', type: 'string', required: false }
            ]
          },
          {
            name: 'materials',
            description: 'Material Master Data',
            fields: [
              { name: 'MATNR', type: 'string', required: true },
              { name: 'MAKTX', type: 'string', required: true },
              { name: 'MEINS', type: 'string', required: false }
            ]
          }
        ];
      
      default:
        return [
          {
            name: 'generic_entity',
            description: 'Generic Entity',
            fields: [
              { name: 'id', type: 'number', required: true },
              { name: 'name', type: 'string', required: true }
            ]
          }
        ];
    }
  }

  getERPSystems(tenantId: string): ERPSystem[] {
    return Array.from(this.systems.values()).filter(s => s.tenantId === tenantId);
  }

  getSyncMappings(tenantId: string): SyncMapping[] {
    return Array.from(this.mappings.values()).filter(m => {
      const system = this.systems.get(m.erpSystemId);
      return system?.tenantId === tenantId;
    });
  }

  getSyncExecutions(mappingId: string): SyncExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.mappingId === mappingId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getSyncMetrics(): {
    totalSyncs: number;
    successRate: number;
    avgDuration: number;
    totalRecordsProcessed: number;
  } {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    
    const totalDuration = completed.reduce((sum, e) => {
      if (e.endTime) {
        return sum + (new Date(e.endTime).getTime() - new Date(e.startTime).getTime());
      }
      return sum;
    }, 0);

    return {
      totalSyncs: executions.length,
      successRate: completed.length / executions.length,
      avgDuration: totalDuration / completed.length,
      totalRecordsProcessed: executions.reduce((sum, e) => sum + e.recordsProcessed, 0)
    };
  }
}