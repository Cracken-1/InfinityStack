export interface ConversationContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  history: Message[];
  intent?: string;
  entities: Record<string, any>;
  businessContext: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Intent {
  name: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface BusinessAction {
  type: 'query_data' | 'create_record' | 'update_record' | 'generate_report' | 'schedule_task';
  parameters: Record<string, any>;
  confirmation?: boolean;
}

export class IntelligentAssistant {
  private conversations: Map<string, ConversationContext> = new Map();
  private intents: Map<string, any> = new Map();

  constructor() {
    this.initializeIntents();
  }

  async processMessage(
    userId: string, 
    tenantId: string, 
    message: string, 
    sessionId?: string
  ): Promise<{
    response: string;
    actions?: BusinessAction[];
    suggestions?: string[];
    requiresConfirmation?: boolean;
  }> {
    const session = sessionId || crypto.randomUUID();
    let context = this.conversations.get(session);

    if (!context) {
      context = {
        userId,
        tenantId,
        sessionId: session,
        history: [],
        entities: {},
        businessContext: await this.loadBusinessContext(tenantId)
      };
      this.conversations.set(session, context);
    }

    // Add user message to history
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    context.history.push(userMessage);

    // Process natural language understanding
    const intent = await this.extractIntent(message, context);
    const entities = await this.extractEntities(message);
    
    // Update context
    context.intent = intent.name;
    context.entities = { ...context.entities, ...entities };

    // Generate response and actions
    const result = await this.generateResponse(intent, context);

    // Add assistant response to history
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.response,
      timestamp: new Date().toISOString(),
      metadata: { intent: intent.name, confidence: intent.confidence }
    };
    context.history.push(assistantMessage);

    return result;
  }

  private async loadBusinessContext(tenantId: string): Promise<Record<string, any>> {
    // Load tenant-specific business data
    return {
      industry: 'retail', // Mock data
      totalProducts: 1250,
      totalOrders: 3400,
      totalCustomers: 890,
      monthlyRevenue: 125000,
      topProducts: ['Product A', 'Product B', 'Product C'],
      recentOrders: 45,
      lowStockItems: 12
    };
  }

  private async extractIntent(message: string, context: ConversationContext): Promise<Intent> {
    const lowerMessage = message.toLowerCase();
    
    // Sales and revenue queries
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      return {
        name: 'query_sales',
        confidence: 0.9,
        parameters: this.extractTimeParameters(message)
      };
    }

    // Inventory queries
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      return {
        name: 'query_inventory',
        confidence: 0.85,
        parameters: this.extractProductParameters(message)
      };
    }

    // Customer queries
    if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
      return {
        name: 'query_customers',
        confidence: 0.8,
        parameters: {}
      };
    }

    // Report generation
    if (lowerMessage.includes('report') || lowerMessage.includes('generate')) {
      return {
        name: 'generate_report',
        confidence: 0.85,
        parameters: this.extractReportParameters(message)
      };
    }

    // Task creation
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
      return {
        name: 'create_task',
        confidence: 0.75,
        parameters: this.extractTaskParameters(message)
      };
    }

    // General help
    return {
      name: 'general_help',
      confidence: 0.6,
      parameters: {}
    };
  }

  private async extractEntities(message: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};
    
    // Extract dates
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|today|yesterday|last week|this month)\b/gi;
    const dates = message.match(dateRegex);
    if (dates) entities.dates = dates;

    // Extract numbers
    const numberRegex = /\b\d+\b/g;
    const numbers = message.match(numberRegex);
    if (numbers) entities.numbers = numbers.map(n => parseInt(n));

    // Extract product names (simple pattern)
    const productRegex = /\b(product\s+[a-z]+|item\s+[a-z]+)\b/gi;
    const products = message.match(productRegex);
    if (products) entities.products = products;

    return entities;
  }

  private extractTimeParameters(message: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (message.includes('today')) params.period = 'today';
    else if (message.includes('week')) params.period = 'week';
    else if (message.includes('month')) params.period = 'month';
    else if (message.includes('year')) params.period = 'year';
    else params.period = 'month'; // default

    return params;
  }

  private extractProductParameters(message: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (message.includes('low stock')) params.filter = 'low_stock';
    else if (message.includes('out of stock')) params.filter = 'out_of_stock';
    
    return params;
  }

  private extractReportParameters(message: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (message.includes('sales')) params.type = 'sales';
    else if (message.includes('inventory')) params.type = 'inventory';
    else if (message.includes('customer')) params.type = 'customer';
    else params.type = 'general';

    return params;
  }

  private extractTaskParameters(message: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (message.includes('product')) params.type = 'product';
    else if (message.includes('order')) params.type = 'order';
    else if (message.includes('customer')) params.type = 'customer';
    
    return params;
  }

  private async generateResponse(intent: Intent, context: ConversationContext): Promise<{
    response: string;
    actions?: BusinessAction[];
    suggestions?: string[];
    requiresConfirmation?: boolean;
  }> {
    const { businessContext } = context;

    switch (intent.name) {
      case 'query_sales':
        return {
          response: `Based on your ${intent.parameters.period || 'monthly'} data, you have $${businessContext.monthlyRevenue.toLocaleString()} in revenue from ${businessContext.totalOrders} orders. Your top performing products are ${businessContext.topProducts.join(', ')}.`,
          actions: [{
            type: 'query_data',
            parameters: { table: 'orders', period: intent.parameters.period }
          }],
          suggestions: [
            'Show me a detailed sales report',
            'What are the trending products?',
            'Compare with last month'
          ]
        };

      case 'query_inventory':
        return {
          response: `You currently have ${businessContext.totalProducts} products in inventory. ${businessContext.lowStockItems} items are running low on stock and need attention.`,
          actions: [{
            type: 'query_data',
            parameters: { table: 'inventory', filter: intent.parameters.filter }
          }],
          suggestions: [
            'Show me low stock items',
            'Generate inventory report',
            'Set up stock alerts'
          ]
        };

      case 'query_customers':
        return {
          response: `You have ${businessContext.totalCustomers} total customers. Recent activity shows ${businessContext.recentOrders} new orders this week.`,
          suggestions: [
            'Show customer analytics',
            'Find top customers',
            'Customer retention report'
          ]
        };

      case 'generate_report':
        return {
          response: `I can generate a ${intent.parameters.type} report for you. This will include key metrics, trends, and actionable insights.`,
          actions: [{
            type: 'generate_report',
            parameters: { type: intent.parameters.type, format: 'pdf' }
          }],
          requiresConfirmation: true,
          suggestions: [
            'Yes, generate the report',
            'Customize report parameters',
            'Schedule regular reports'
          ]
        };

      case 'create_task':
        return {
          response: `I can help you create a new ${intent.parameters.type || 'task'}. What specific details would you like to include?`,
          actions: [{
            type: 'create_record',
            parameters: { type: intent.parameters.type }
          }],
          suggestions: [
            'Add product details',
            'Set up automated workflow',
            'Schedule for later'
          ]
        };

      default:
        return {
          response: `I'm here to help you manage your business! I can assist with sales analysis, inventory management, customer insights, report generation, and task automation. What would you like to know?`,
          suggestions: [
            'Show me today\'s sales',
            'Check inventory status',
            'Generate monthly report',
            'What are my top customers?'
          ]
        };
    }
  }

  async executeAction(action: BusinessAction, context: ConversationContext): Promise<any> {
    switch (action.type) {
      case 'query_data':
        return this.queryBusinessData(action.parameters, context);
      case 'generate_report':
        return this.generateBusinessReport(action.parameters, context);
      case 'create_record':
        return this.createBusinessRecord(action.parameters, context);
      default:
        return { success: false, message: 'Unknown action type' };
    }
  }

  private async queryBusinessData(params: any, context: ConversationContext): Promise<any> {
    // Mock data query based on parameters
    const mockData = {
      orders: [
        { id: 1, total: 150, date: '2024-01-15', customer: 'John Doe' },
        { id: 2, total: 200, date: '2024-01-14', customer: 'Jane Smith' }
      ],
      inventory: [
        { id: 1, name: 'Product A', stock: 5, minLevel: 10 },
        { id: 2, name: 'Product B', stock: 0, minLevel: 5 }
      ]
    };

    return mockData[params.table as keyof typeof mockData] || [];
  }

  private async generateBusinessReport(params: any, context: ConversationContext): Promise<any> {
    return {
      reportId: crypto.randomUUID(),
      type: params.type,
      generatedAt: new Date().toISOString(),
      url: `/reports/${params.type}-${Date.now()}.pdf`
    };
  }

  private async createBusinessRecord(params: any, context: ConversationContext): Promise<any> {
    return {
      recordId: crypto.randomUUID(),
      type: params.type,
      status: 'created',
      createdAt: new Date().toISOString()
    };
  }

  private initializeIntents() {
    // Initialize common business intents
    const intents = [
      'query_sales', 'query_inventory', 'query_customers',
      'generate_report', 'create_task', 'schedule_meeting',
      'analyze_trends', 'forecast_demand', 'optimize_pricing'
    ];

    intents.forEach(intent => {
      this.intents.set(intent, { name: intent, examples: [] });
    });
  }

  getConversationHistory(sessionId: string): Message[] {
    const context = this.conversations.get(sessionId);
    return context?.history || [];
  }

  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }
}