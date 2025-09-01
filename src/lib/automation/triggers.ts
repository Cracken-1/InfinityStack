export interface Trigger {
  id: string;
  name: string;
  type: 'webhook' | 'schedule' | 'event' | 'database';
  config: Record<string, any>;
  workflowId: string;
  tenantId: string;
  active: boolean;
  lastTriggered?: string;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  payload: Record<string, any>;
  timestamp: string;
  processed: boolean;
}

export class TriggerManager {
  private triggers: Map<string, Trigger> = new Map();
  private events: TriggerEvent[] = [];
  private scheduledTriggers: Map<string, NodeJS.Timeout> = new Map();

  createTrigger(trigger: Omit<Trigger, 'id'>): Trigger {
    const newTrigger: Trigger = {
      ...trigger,
      id: crypto.randomUUID()
    };

    this.triggers.set(newTrigger.id, newTrigger);

    if (newTrigger.type === 'schedule' && newTrigger.active) {
      this.scheduleRecurringTrigger(newTrigger);
    }

    return newTrigger;
  }

  async processTrigger(triggerId: string, payload: Record<string, any> = {}) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.active) return;

    const event: TriggerEvent = {
      id: crypto.randomUUID(),
      triggerId,
      payload,
      timestamp: new Date().toISOString(),
      processed: false
    };

    this.events.push(event);

    // Update last triggered
    trigger.lastTriggered = event.timestamp;

    // In production, this would execute the associated workflow
    console.log(`Trigger ${trigger.name} fired with payload:`, payload);

    event.processed = true;
    return event;
  }

  // Webhook trigger
  async handleWebhook(url: string, payload: Record<string, any>) {
    const webhookTriggers = Array.from(this.triggers.values()).filter(
      t => t.type === 'webhook' && t.config.url === url && t.active
    );

    for (const trigger of webhookTriggers) {
      await this.processTrigger(trigger.id, payload);
    }
  }

  // Database event trigger
  async handleDatabaseEvent(table: string, action: string, record: Record<string, any>) {
    const dbTriggers = Array.from(this.triggers.values()).filter(
      t => t.type === 'database' && 
          t.config.table === table && 
          t.config.action === action && 
          t.active
    );

    for (const trigger of dbTriggers) {
      await this.processTrigger(trigger.id, { action, record });
    }
  }

  // Custom event trigger
  async handleCustomEvent(eventName: string, payload: Record<string, any>) {
    const eventTriggers = Array.from(this.triggers.values()).filter(
      t => t.type === 'event' && t.config.eventName === eventName && t.active
    );

    for (const trigger of eventTriggers) {
      await this.processTrigger(trigger.id, payload);
    }
  }

  private scheduleRecurringTrigger(trigger: Trigger) {
    if (trigger.type !== 'schedule') return;

    const { interval, unit } = trigger.config; // e.g., { interval: 5, unit: 'minutes' }
    let milliseconds = 0;

    switch (unit) {
      case 'seconds':
        milliseconds = interval * 1000;
        break;
      case 'minutes':
        milliseconds = interval * 60 * 1000;
        break;
      case 'hours':
        milliseconds = interval * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = interval * 24 * 60 * 60 * 1000;
        break;
    }

    const timeoutId = setInterval(() => {
      this.processTrigger(trigger.id, { scheduledAt: new Date().toISOString() });
    }, milliseconds);

    this.scheduledTriggers.set(trigger.id, timeoutId);
  }

  deactivateTrigger(triggerId: string) {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.active = false;
      
      // Clear scheduled trigger if exists
      const timeoutId = this.scheduledTriggers.get(triggerId);
      if (timeoutId) {
        clearInterval(timeoutId);
        this.scheduledTriggers.delete(triggerId);
      }
    }
  }

  getTriggers(tenantId: string): Trigger[] {
    return Array.from(this.triggers.values()).filter(t => t.tenantId === tenantId);
  }

  getTriggerEvents(triggerId: string): TriggerEvent[] {
    return this.events.filter(e => e.triggerId === triggerId);
  }
}