export interface BillingAccount {
  id: string;
  tenantId: string;
  companyName: string;
  billingEmail: string;
  taxId?: string;
  address: BillingAddress;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod?: string;
  currency: string;
  taxRate: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'stripe' | 'invoice';
  provider: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  isDefault: boolean;
  isValid: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  billingPeriod: {
    start: string;
    end: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: 'subscription' | 'usage' | 'addon' | 'discount' | 'tax';
  quantity: number;
  unitPrice: number;
  total: number;
  period?: {
    start: string;
    end: string;
  };
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethodId: string;
  transactionId?: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  resourceType: string;
  quantity: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BillingMetrics {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  lifetimeValue: number;
  paymentSuccessRate: number;
  outstandingInvoices: number;
  totalRevenue: number;
}

export class BillingEngine {
  private accounts: Map<string, BillingAccount> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private invoiceCounter = 1000;

  createBillingAccount(account: Omit<BillingAccount, 'id' | 'createdAt' | 'updatedAt'>): BillingAccount {
    const newAccount: BillingAccount = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.accounts.set(newAccount.tenantId, newAccount);
    return newAccount;
  }

  addPaymentMethod(tenantId: string, paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod {
    const account = this.accounts.get(tenantId);
    if (!account) throw new Error('Billing account not found');

    const newPaymentMethod: PaymentMethod = {
      ...paymentMethod,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    // Set as default if it's the first payment method
    if (account.paymentMethods.length === 0) {
      newPaymentMethod.isDefault = true;
      account.defaultPaymentMethod = newPaymentMethod.id;
    }

    account.paymentMethods.push(newPaymentMethod);
    account.updatedAt = new Date().toISOString();

    return newPaymentMethod;
  }

  recordUsage(tenantId: string, usage: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
    const record: UsageRecord = {
      ...usage,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    const tenantUsage = this.usageRecords.get(tenantId) || [];
    tenantUsage.push(record);
    this.usageRecords.set(tenantId, tenantUsage);

    return record;
  }

  async generateInvoice(tenantId: string, billingPeriod: { start: string; end: string }): Promise<Invoice> {
    const account = this.accounts.get(tenantId);
    if (!account) throw new Error('Billing account not found');

    // Get subscription details (would integrate with TierManager)
    const subscriptionCost = await this.calculateSubscriptionCost(tenantId, billingPeriod);
    
    // Get usage-based charges
    const usageCost = await this.calculateUsageCost(tenantId, billingPeriod);
    
    // Get add-ons and discounts
    const addOnsCost = await this.calculateAddOnsCost(tenantId, billingPeriod);
    const discounts = await this.calculateDiscounts(tenantId, billingPeriod);

    const lineItems: InvoiceLineItem[] = [];

    // Add subscription line item
    if (subscriptionCost.amount > 0) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: `${subscriptionCost.tierName} Plan`,
        type: 'subscription',
        quantity: 1,
        unitPrice: subscriptionCost.amount,
        total: subscriptionCost.amount,
        period: billingPeriod
      });
    }

    // Add usage line items
    usageCost.forEach(usage => {
      lineItems.push({
        id: crypto.randomUUID(),
        description: `${usage.description} (${usage.quantity} ${usage.unit})`,
        type: 'usage',
        quantity: usage.quantity,
        unitPrice: usage.unitPrice,
        total: usage.total,
        period: billingPeriod,
        metadata: { resourceType: usage.resourceType }
      });
    });

    // Add add-on line items
    addOnsCost.forEach(addOn => {
      lineItems.push({
        id: crypto.randomUUID(),
        description: addOn.description,
        type: 'addon',
        quantity: addOn.quantity,
        unitPrice: addOn.unitPrice,
        total: addOn.total,
        period: billingPeriod
      });
    });

    // Add discount line items
    discounts.forEach(discount => {
      lineItems.push({
        id: crypto.randomUUID(),
        description: discount.description,
        type: 'discount',
        quantity: 1,
        unitPrice: -discount.amount,
        total: -discount.amount,
        period: billingPeriod
      });
    });

    const subtotal = lineItems
      .filter(item => item.type !== 'discount' && item.type !== 'tax')
      .reduce((sum, item) => sum + item.total, 0);

    const discountAmount = lineItems
      .filter(item => item.type === 'discount')
      .reduce((sum, item) => sum + Math.abs(item.total), 0);

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * account.taxRate;

    // Add tax line item
    if (taxAmount > 0) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: `Tax (${(account.taxRate * 100).toFixed(1)}%)`,
        type: 'tax',
        quantity: 1,
        unitPrice: taxAmount,
        total: taxAmount
      });
    }

    const total = subtotal - discountAmount + taxAmount;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      tenantId,
      invoiceNumber: `INV-${this.invoiceCounter++}`,
      status: 'pending',
      billingPeriod,
      lineItems,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      currency: account.currency,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async processPayment(invoiceId: string, paymentMethodId?: string): Promise<Payment> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const account = this.accounts.get(invoice.tenantId);
    if (!account) throw new Error('Billing account not found');

    const methodId = paymentMethodId || account.defaultPaymentMethod;
    if (!methodId) throw new Error('No payment method available');

    const paymentMethod = account.paymentMethods.find(pm => pm.id === methodId);
    if (!paymentMethod || !paymentMethod.isValid) {
      throw new Error('Invalid payment method');
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      invoiceId,
      tenantId: invoice.tenantId,
      amount: invoice.total,
      currency: invoice.currency,
      status: 'pending',
      paymentMethodId: methodId,
      createdAt: new Date().toISOString()
    };

    this.payments.set(payment.id, payment);

    try {
      // Process payment with payment provider
      const result = await this.processWithProvider(payment, paymentMethod);
      
      if (result.success) {
        payment.status = 'completed';
        payment.transactionId = result.transactionId;
        payment.processedAt = new Date().toISOString();
        
        // Update invoice
        invoice.status = 'paid';
        invoice.paidAt = payment.processedAt;
        invoice.paymentMethod = paymentMethod.type;
        invoice.updatedAt = new Date().toISOString();
      } else {
        payment.status = 'failed';
        payment.failureReason = result.error;
      }
    } catch (error) {
      payment.status = 'failed';
      payment.failureReason = error instanceof Error ? error.message : 'Payment processing failed';
    }

    return payment;
  }

  private async processWithProvider(payment: Payment, paymentMethod: PaymentMethod): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    // Mock payment processing - in production, integrate with Stripe, PayPal, etc.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 95% success rate
    if (Math.random() > 0.05) {
      return {
        success: true,
        transactionId: `txn_${crypto.randomUUID().substring(0, 8)}`
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by bank'
      };
    }
  }

  private async calculateSubscriptionCost(tenantId: string, period: { start: string; end: string }): Promise<{
    amount: number;
    tierName: string;
  }> {
    // Mock subscription cost calculation - would integrate with TierManager
    return {
      amount: 99,
      tierName: 'Professional'
    };
  }

  private async calculateUsageCost(tenantId: string, period: { start: string; end: string }): Promise<Array<{
    resourceType: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>> {
    const tenantUsage = this.usageRecords.get(tenantId) || [];
    const periodUsage = tenantUsage.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= new Date(period.start) && recordDate <= new Date(period.end);
    });

    // Aggregate usage by resource type
    const aggregated = periodUsage.reduce((acc, record) => {
      if (!acc[record.resourceType]) {
        acc[record.resourceType] = { quantity: 0, unit: record.unit };
      }
      acc[record.resourceType].quantity += record.quantity;
      return acc;
    }, {} as Record<string, { quantity: number; unit: string }>);

    // Calculate costs based on usage tiers
    const usageCosts: any[] = [];
    
    Object.entries(aggregated).forEach(([resourceType, usage]) => {
      const unitPrice = this.getUsagePrice(resourceType);
      const total = usage.quantity * unitPrice;
      
      if (total > 0) {
        usageCosts.push({
          resourceType,
          description: this.getUsageDescription(resourceType),
          quantity: usage.quantity,
          unit: usage.unit,
          unitPrice,
          total
        });
      }
    });

    return usageCosts;
  }

  private getUsagePrice(resourceType: string): number {
    const prices: Record<string, number> = {
      'api_calls': 0.001, // $0.001 per API call
      'storage': 0.1, // $0.1 per GB
      'ai_requests': 0.01, // $0.01 per AI request
      'bandwidth': 0.05 // $0.05 per GB
    };
    
    return prices[resourceType] || 0;
  }

  private getUsageDescription(resourceType: string): string {
    const descriptions: Record<string, string> = {
      'api_calls': 'API Calls',
      'storage': 'Storage',
      'ai_requests': 'AI Requests',
      'bandwidth': 'Bandwidth'
    };
    
    return descriptions[resourceType] || resourceType;
  }

  private async calculateAddOnsCost(tenantId: string, period: { start: string; end: string }): Promise<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>> {
    // Mock add-ons calculation - would integrate with subscription data
    return [
      {
        description: 'Additional Users (5)',
        quantity: 5,
        unitPrice: 10,
        total: 50
      }
    ];
  }

  private async calculateDiscounts(tenantId: string, period: { start: string; end: string }): Promise<Array<{
    description: string;
    amount: number;
  }>> {
    // Mock discounts calculation
    return [
      {
        description: 'Annual Billing Discount (10%)',
        amount: 14.9
      }
    ];
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error('Payment not found');

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;
    
    const refund: Payment = {
      id: crypto.randomUUID(),
      invoiceId: payment.invoiceId,
      tenantId: payment.tenantId,
      amount: -refundAmount,
      currency: payment.currency,
      status: 'completed',
      paymentMethodId: payment.paymentMethodId,
      transactionId: `refund_${crypto.randomUUID().substring(0, 8)}`,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.payments.set(refund.id, refund);

    // Update original invoice if fully refunded
    if (refundAmount === payment.amount) {
      const invoice = this.invoices.get(payment.invoiceId);
      if (invoice) {
        invoice.status = 'refunded';
        invoice.updatedAt = new Date().toISOString();
      }
    }

    return refund;
  }

  getBillingMetrics(): BillingMetrics {
    const allInvoices = Array.from(this.invoices.values());
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    const allPayments = Array.from(this.payments.values());
    const completedPayments = allPayments.filter(p => p.status === 'completed' && p.amount > 0);

    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthlyRevenue = this.calculateMonthlyRevenue(paidInvoices);
    const uniqueTenants = new Set(paidInvoices.map(inv => inv.tenantId)).size;

    return {
      monthlyRecurringRevenue: monthlyRevenue,
      annualRecurringRevenue: monthlyRevenue * 12,
      averageRevenuePerUser: uniqueTenants > 0 ? totalRevenue / uniqueTenants : 0,
      churnRate: 0.05, // Mock 5% churn rate
      lifetimeValue: uniqueTenants > 0 ? totalRevenue / uniqueTenants / 0.05 : 0, // LTV = ARPU / Churn Rate
      paymentSuccessRate: allPayments.length > 0 ? 
        (completedPayments.length / allPayments.length) * 100 : 0,
      outstandingInvoices: allInvoices.filter(inv => inv.status === 'overdue').length,
      totalRevenue
    };
  }

  private calculateMonthlyRevenue(invoices: Invoice[]): number {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    return invoices
      .filter(inv => inv.createdAt.substring(0, 7) === currentMonth)
      .reduce((sum, inv) => sum + inv.total, 0);
  }

  getBillingAccount(tenantId: string): BillingAccount | null {
    return this.accounts.get(tenantId) || null;
  }

  getInvoices(tenantId: string): Invoice[] {
    return Array.from(this.invoices.values())
      .filter(inv => inv.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPayments(tenantId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUsageRecords(tenantId: string, resourceType?: string): UsageRecord[] {
    const records = this.usageRecords.get(tenantId) || [];
    
    if (resourceType) {
      return records.filter(record => record.resourceType === resourceType);
    }
    
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const account = this.accounts.get(invoice.tenantId);
    if (!account) throw new Error('Billing account not found');

    // Mock email sending
    console.log(`Sending invoice ${invoice.invoiceNumber} to ${account.billingEmail}`);
  }

  async sendPaymentReminder(invoiceId: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    // Mock reminder email
    console.log(`Sending payment reminder for invoice ${invoice.invoiceNumber}`);
  }
}