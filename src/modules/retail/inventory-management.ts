export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  location: string;
  barcode?: string;
  expiryDate?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  userId: string;
  timestamp: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: string;
}

export class InventoryManager {
  private items: Map<string, InventoryItem> = new Map();
  private movements: StockMovement[] = [];
  private alerts: StockAlert[] = [];

  addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.items.set(newItem.id, newItem);
    this.checkStockLevels(newItem);
    return newItem;
  }

  updateStock(itemId: string, quantity: number, type: StockMovement['type'], reason: string, userId: string): StockMovement {
    const item = this.items.get(itemId);
    if (!item) throw new Error('Item not found');

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity,
      reason,
      userId,
      timestamp: new Date().toISOString()
    };

    // Update item quantity
    switch (type) {
      case 'in':
        item.quantity += quantity;
        break;
      case 'out':
        item.quantity = Math.max(0, item.quantity - quantity);
        break;
      case 'adjustment':
        item.quantity = quantity;
        break;
    }

    item.updatedAt = new Date().toISOString();
    this.movements.push(movement);
    this.checkStockLevels(item);

    return movement;
  }

  transferStock(itemId: string, quantity: number, fromLocation: string, toLocation: string, userId: string): StockMovement {
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type: 'transfer',
      quantity,
      reason: `Transfer from ${fromLocation} to ${toLocation}`,
      userId,
      timestamp: new Date().toISOString(),
      fromLocation,
      toLocation
    };

    this.movements.push(movement);
    return movement;
  }

  private checkStockLevels(item: InventoryItem) {
    // Clear existing alerts for this item
    this.alerts = this.alerts.filter(alert => alert.itemId !== item.id);

    // Check for low stock
    if (item.quantity <= item.minStockLevel && item.quantity > 0) {
      this.createAlert(item.id, 'low_stock', `${item.name} is running low (${item.quantity} remaining)`, 'medium');
    }

    // Check for out of stock
    if (item.quantity === 0) {
      this.createAlert(item.id, 'out_of_stock', `${item.name} is out of stock`, 'high');
    }

    // Check for overstock
    if (item.quantity > item.maxStockLevel) {
      this.createAlert(item.id, 'overstock', `${item.name} is overstocked (${item.quantity} units)`, 'low');
    }

    // Check for expiring items
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        this.createAlert(item.id, 'expiring', `${item.name} expires in ${daysUntilExpiry} days`, 'medium');
      }
    }
  }

  private createAlert(itemId: string, type: StockAlert['type'], message: string, severity: StockAlert['severity']) {
    const alert: StockAlert = {
      id: crypto.randomUUID(),
      itemId,
      type,
      message,
      severity,
      acknowledged: false,
      createdAt: new Date().toISOString()
    };

    this.alerts.push(alert);
  }

  getInventoryReport(tenantId: string): {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    topSellingItems: InventoryItem[];
  } {
    const items = Array.from(this.items.values()).filter(item => item.tenantId === tenantId);
    
    return {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0),
      lowStockItems: items.filter(item => item.quantity <= item.minStockLevel).length,
      outOfStockItems: items.filter(item => item.quantity === 0).length,
      topSellingItems: items.slice(0, 10) // Mock top selling
    };
  }

  getStockMovements(itemId?: string, limit = 50): StockMovement[] {
    let movements = this.movements;
    
    if (itemId) {
      movements = movements.filter(m => m.itemId === itemId);
    }

    return movements
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getAlerts(tenantId: string, acknowledged = false): StockAlert[] {
    return this.alerts
      .filter(alert => {
        const item = this.items.get(alert.itemId);
        return item?.tenantId === tenantId && alert.acknowledged === acknowledged;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  searchItems(tenantId: string, query: string): InventoryItem[] {
    const items = Array.from(this.items.values()).filter(item => item.tenantId === tenantId);
    
    return items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.sku.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  getItemsByCategory(tenantId: string, category: string): InventoryItem[] {
    return Array.from(this.items.values()).filter(
      item => item.tenantId === tenantId && item.category === category
    );
  }
}