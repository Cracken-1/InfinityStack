export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  tenantId: string;
  deviceTokens: string[];
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  tenantId: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  registeredAt: string;
  lastActive: string;
}

export class PushNotificationService {
  private notifications: Map<string, PushNotification> = new Map();
  private devices: Map<string, DeviceRegistration> = new Map();

  registerDevice(registration: Omit<DeviceRegistration, 'id' | 'registeredAt' | 'lastActive'>): DeviceRegistration {
    const newRegistration: DeviceRegistration = {
      ...registration,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    this.devices.set(newRegistration.id, newRegistration);
    return newRegistration;
  }

  async sendNotification(notification: Omit<PushNotification, 'id' | 'status' | 'createdAt'>): Promise<PushNotification> {
    const newNotification: PushNotification = {
      ...notification,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.notifications.set(newNotification.id, newNotification);

    try {
      // Send to each device token
      for (const token of notification.deviceTokens) {
        await this.sendToDevice(token, newNotification);
      }

      newNotification.status = 'sent';
      newNotification.sentAt = new Date().toISOString();
    } catch (error) {
      newNotification.status = 'failed';
      console.error('Failed to send push notification:', error);
    }

    return newNotification;
  }

  async sendToUser(userId: string, tenantId: string, title: string, body: string, data?: Record<string, any>): Promise<PushNotification> {
    const userDevices = this.getUserDevices(userId, tenantId);
    const deviceTokens = userDevices.map(device => device.deviceToken);

    return this.sendNotification({
      title,
      body,
      data,
      userId,
      tenantId,
      deviceTokens
    });
  }

  async sendBulkNotification(userIds: string[], tenantId: string, title: string, body: string, data?: Record<string, any>): Promise<PushNotification[]> {
    const notifications: Promise<PushNotification>[] = [];

    for (const userId of userIds) {
      notifications.push(this.sendToUser(userId, tenantId, title, body, data));
    }

    return Promise.all(notifications);
  }

  private async sendToDevice(deviceToken: string, notification: PushNotification): Promise<void> {
    // Mock sending to device - in production, use FCM/APNS
    console.log(`Sending push notification to device ${deviceToken}:`, {
      title: notification.title,
      body: notification.body,
      data: notification.data
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getUserDevices(userId: string, tenantId: string): DeviceRegistration[] {
    return Array.from(this.devices.values()).filter(
      device => device.userId === userId && device.tenantId === tenantId
    );
  }

  updateDeviceActivity(deviceToken: string) {
    const device = Array.from(this.devices.values()).find(d => d.deviceToken === deviceToken);
    if (device) {
      device.lastActive = new Date().toISOString();
    }
  }

  unregisterDevice(deviceToken: string) {
    const deviceEntry = Array.from(this.devices.entries()).find(([_, device]) => device.deviceToken === deviceToken);
    if (deviceEntry) {
      this.devices.delete(deviceEntry[0]);
    }
  }

  getNotificationHistory(userId: string, tenantId: string): PushNotification[] {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && notification.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Template-based notifications
  async sendTemplateNotification(templateId: string, userId: string, tenantId: string, variables: Record<string, any>): Promise<PushNotification> {
    const template = this.getNotificationTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const title = this.replaceVariables(template.title, variables);
    const body = this.replaceVariables(template.body, variables);

    return this.sendToUser(userId, tenantId, title, body, template.data);
  }

  private getNotificationTemplate(templateId: string) {
    const templates = {
      'order_shipped': {
        title: 'Order Shipped!',
        body: 'Your order #{orderNumber} has been shipped and is on its way.',
        data: { type: 'order_update' }
      },
      'payment_received': {
        title: 'Payment Received',
        body: 'We have received your payment of ${amount}. Thank you!',
        data: { type: 'payment' }
      }
    };

    return templates[templateId as keyof typeof templates];
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  }
}