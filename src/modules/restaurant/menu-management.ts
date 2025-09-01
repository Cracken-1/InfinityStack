export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  preparationTime: number; // in minutes
  ingredients: Ingredient[];
  allergens: string[];
  dietary: ('vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free')[];
  available: boolean;
  image?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  tenantId: string;
}

export interface MenuModifier {
  id: string;
  name: string;
  type: 'required' | 'optional';
  options: ModifierOption[];
  menuItemId: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  available: boolean;
}

export interface DailySpecial {
  id: string;
  menuItemId: string;
  specialPrice: number;
  date: string;
  description?: string;
  tenantId: string;
}

export class MenuManager {
  private menuItems: Map<string, MenuItem> = new Map();
  private categories: Map<string, MenuCategory> = new Map();
  private modifiers: Map<string, MenuModifier> = new Map();
  private specials: Map<string, DailySpecial> = new Map();

  // Menu Item Management
  addMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.menuItems.set(newItem.id, newItem);
    return newItem;
  }

  updateMenuItem(itemId: string, updates: Partial<MenuItem>): MenuItem | null {
    const item = this.menuItems.get(itemId);
    if (!item) return null;

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.menuItems.set(itemId, updatedItem);
    return updatedItem;
  }

  // Category Management
  addCategory(category: Omit<MenuCategory, 'id'>): MenuCategory {
    const newCategory: MenuCategory = {
      ...category,
      id: crypto.randomUUID()
    };

    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  // Modifier Management
  addModifier(modifier: Omit<MenuModifier, 'id'>): MenuModifier {
    const newModifier: MenuModifier = {
      ...modifier,
      id: crypto.randomUUID(),
      options: modifier.options.map(option => ({
        ...option,
        id: crypto.randomUUID()
      }))
    };

    this.modifiers.set(newModifier.id, newModifier);
    return newModifier;
  }

  // Daily Specials
  addDailySpecial(special: Omit<DailySpecial, 'id'>): DailySpecial {
    const newSpecial: DailySpecial = {
      ...special,
      id: crypto.randomUUID()
    };

    this.specials.set(newSpecial.id, newSpecial);
    return newSpecial;
  }

  // Menu Display
  getFullMenu(tenantId: string): {
    categories: MenuCategory[];
    items: Record<string, MenuItem[]>;
    specials: DailySpecial[];
  } {
    const categories = Array.from(this.categories.values())
      .filter(cat => cat.tenantId === tenantId && cat.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const items: Record<string, MenuItem[]> = {};
    
    categories.forEach(category => {
      items[category.id] = Array.from(this.menuItems.values())
        .filter(item => item.tenantId === tenantId && item.category === category.name && item.available);
    });

    const todaySpecials = Array.from(this.specials.values())
      .filter(special => {
        const today = new Date().toISOString().split('T')[0];
        return special.tenantId === tenantId && special.date === today;
      });

    return { categories, items, specials: todaySpecials };
  }

  // Pricing and Cost Analysis
  calculateItemCost(itemId: string): number {
    const item = this.menuItems.get(itemId);
    if (!item) return 0;

    return item.ingredients.reduce((total, ingredient) => {
      return total + (ingredient.quantity * ingredient.cost);
    }, 0);
  }

  calculateProfitMargin(itemId: string): number {
    const item = this.menuItems.get(itemId);
    if (!item) return 0;

    const cost = this.calculateItemCost(itemId);
    const profit = item.price - cost;
    return (profit / item.price) * 100;
  }

  // Menu Engineering Analysis
  getMenuAnalysis(tenantId: string): {
    highProfitItems: MenuItem[];
    lowProfitItems: MenuItem[];
    popularItems: MenuItem[];
    slowMovingItems: MenuItem[];
  } {
    const items = Array.from(this.menuItems.values()).filter(item => item.tenantId === tenantId);

    // Mock analysis - in production, use actual sales data
    const highProfitItems = items.filter(item => this.calculateProfitMargin(item.id) > 60);
    const lowProfitItems = items.filter(item => this.calculateProfitMargin(item.id) < 30);
    
    return {
      highProfitItems: highProfitItems.slice(0, 10),
      lowProfitItems: lowProfitItems.slice(0, 10),
      popularItems: items.slice(0, 10), // Mock popular items
      slowMovingItems: items.slice(-10) // Mock slow moving items
    };
  }

  // Dietary and Allergen Filtering
  getItemsByDietary(tenantId: string, dietary: string): MenuItem[] {
    return Array.from(this.menuItems.values()).filter(item =>
      item.tenantId === tenantId &&
      item.available &&
      item.dietary.includes(dietary as any)
    );
  }

  getItemsWithoutAllergen(tenantId: string, allergen: string): MenuItem[] {
    return Array.from(this.menuItems.values()).filter(item =>
      item.tenantId === tenantId &&
      item.available &&
      !item.allergens.includes(allergen)
    );
  }

  // Kitchen Operations
  getPreparationQueue(): {
    item: MenuItem;
    estimatedTime: number;
    priority: 'high' | 'medium' | 'low';
  }[] {
    // Mock kitchen queue - in production, integrate with order system
    const items = Array.from(this.menuItems.values()).slice(0, 5);
    
    return items.map(item => ({
      item,
      estimatedTime: item.preparationTime,
      priority: item.preparationTime > 20 ? 'high' : item.preparationTime > 10 ? 'medium' : 'low'
    }));
  }

  // Inventory Integration
  checkIngredientAvailability(itemId: string, inventoryLevels: Record<string, number>): {
    available: boolean;
    missingIngredients: string[];
  } {
    const item = this.menuItems.get(itemId);
    if (!item) return { available: false, missingIngredients: [] };

    const missingIngredients: string[] = [];

    for (const ingredient of item.ingredients) {
      const availableQuantity = inventoryLevels[ingredient.id] || 0;
      if (availableQuantity < ingredient.quantity) {
        missingIngredients.push(ingredient.name);
      }
    }

    return {
      available: missingIngredients.length === 0,
      missingIngredients
    };
  }

  // Menu Optimization
  suggestMenuOptimizations(tenantId: string): {
    type: 'price_increase' | 'cost_reduction' | 'remove_item' | 'promote_item';
    itemId: string;
    suggestion: string;
    impact: string;
  }[] {
    const items = Array.from(this.menuItems.values()).filter(item => item.tenantId === tenantId);
    const suggestions: any[] = [];

    items.forEach(item => {
      const margin = this.calculateProfitMargin(item.id);
      
      if (margin < 20) {
        suggestions.push({
          type: 'price_increase',
          itemId: item.id,
          suggestion: `Increase price of ${item.name} by 10%`,
          impact: 'Improve profit margin'
        });
      }
      
      if (margin > 80) {
        suggestions.push({
          type: 'promote_item',
          itemId: item.id,
          suggestion: `Promote ${item.name} as it has high profit margin`,
          impact: 'Increase revenue'
        });
      }
    });

    return suggestions;
  }
}