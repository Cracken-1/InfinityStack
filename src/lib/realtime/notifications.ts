export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId: string;
  tenantId: string;
  read: boolean;
  createdAt: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];

  static getInstance() {
    if (!this.instance) {
      this.instance = new NotificationManager();
    }
    return this.instance;
  }

  async send(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.push(newNotification);
    
    // Send push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png'
      });
    }

    return newNotification;
  }

  getNotifications(userId: string, tenantId: string) {
    return this.notifications.filter(n => 
      n.userId === userId && n.tenantId === tenantId
    );
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}