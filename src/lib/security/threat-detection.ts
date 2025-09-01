export interface ThreatEvent {
  id: string;
  type: 'brute_force' | 'suspicious_login' | 'data_breach' | 'malware' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceIp: string;
  userId?: string;
  tenantId: string;
  timestamp: string;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
}

export class ThreatDetectionService {
  private events: ThreatEvent[] = [];
  private loginAttempts: Map<string, number> = new Map();
  private suspiciousIps: Set<string> = new Set();

  detectBruteForce(ip: string, userId: string, tenantId: string): ThreatEvent | null {
    const key = `${ip}-${userId}`;
    const attempts = (this.loginAttempts.get(key) || 0) + 1;
    this.loginAttempts.set(key, attempts);

    if (attempts >= 5) {
      this.suspiciousIps.add(ip);
      return this.createThreatEvent({
        type: 'brute_force',
        severity: 'high',
        description: `Brute force attack detected from IP ${ip}`,
        sourceIp: ip,
        userId,
        tenantId
      });
    }

    return null;
  }

  detectSuspiciousLogin(ip: string, userId: string, tenantId: string, userAgent: string): ThreatEvent | null {
    // Check for suspicious patterns
    const isSuspiciousLocation = this.isUnusualLocation(ip, userId);
    const isSuspiciousDevice = this.isUnusualDevice(userAgent, userId);

    if (isSuspiciousLocation || isSuspiciousDevice) {
      return this.createThreatEvent({
        type: 'suspicious_login',
        severity: 'medium',
        description: `Suspicious login detected for user ${userId}`,
        sourceIp: ip,
        userId,
        tenantId
      });
    }

    return null;
  }

  detectDataBreach(tenantId: string, dataType: string, accessCount: number): ThreatEvent | null {
    if (accessCount > 1000) { // Threshold for unusual data access
      return this.createThreatEvent({
        type: 'data_breach',
        severity: 'critical',
        description: `Potential data breach: Unusual access to ${dataType}`,
        sourceIp: 'internal',
        tenantId
      });
    }

    return null;
  }

  getThreats(tenantId: string, severity?: string): ThreatEvent[] {
    let threats = this.events.filter(event => event.tenantId === tenantId);
    
    if (severity) {
      threats = threats.filter(event => event.severity === severity);
    }

    return threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  updateThreatStatus(threatId: string, status: ThreatEvent['status']) {
    const threat = this.events.find(e => e.id === threatId);
    if (threat) {
      threat.status = status;
    }
  }

  private createThreatEvent(event: Omit<ThreatEvent, 'id' | 'timestamp' | 'status'>): ThreatEvent {
    const threatEvent: ThreatEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'detected'
    };

    this.events.push(threatEvent);
    
    // In production, trigger alerts
    console.warn('Threat detected:', threatEvent);
    
    return threatEvent;
  }

  private isUnusualLocation(ip: string, userId: string): boolean {
    // Simplified location check
    return Math.random() > 0.8;
  }

  private isUnusualDevice(userAgent: string, userId: string): boolean {
    // Simplified device fingerprinting
    return Math.random() > 0.9;
  }
}