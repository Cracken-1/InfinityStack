export interface DocumentAnalysis {
  id: string;
  documentType: 'invoice' | 'receipt' | 'contract' | 'form' | 'id_document' | 'unknown';
  confidence: number;
  extractedData: Record<string, any>;
  text: string;
  entities: DocumentEntity[];
  tables: TableData[];
  processingTime: number;
  timestamp: string;
}

export interface DocumentEntity {
  type: 'date' | 'amount' | 'company' | 'person' | 'address' | 'phone' | 'email' | 'tax_id';
  value: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  confidence: number;
  boundingBox: BoundingBox;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  vendor: {
    name: string;
    address?: string;
    taxId?: string;
  };
  customer: {
    name: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export class DocumentAI {
  private processedDocuments: Map<string, DocumentAnalysis> = new Map();

  async analyzeDocument(
    documentBuffer: ArrayBuffer | string,
    documentType?: string
  ): Promise<DocumentAnalysis> {
    const startTime = Date.now();
    const documentId = crypto.randomUUID();

    // Simulate OCR processing
    const text = await this.performOCR(documentBuffer);
    
    // Classify document type
    const classification = await this.classifyDocument(text, documentType);
    
    // Extract entities
    const entities = await this.extractEntities(text);
    
    // Extract tables
    const tables = await this.extractTables(text);
    
    // Extract structured data based on document type
    const extractedData = await this.extractStructuredData(text, classification.type, entities);

    const processingTime = Date.now() - startTime;

    const analysis: DocumentAnalysis = {
      id: documentId,
      documentType: classification.type,
      confidence: classification.confidence,
      extractedData,
      text,
      entities,
      tables,
      processingTime,
      timestamp: new Date().toISOString()
    };

    this.processedDocuments.set(documentId, analysis);
    return analysis;
  }

  private async performOCR(documentBuffer: ArrayBuffer | string): Promise<string> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock OCR result based on document type
    const mockTexts = {
      invoice: `
        INVOICE #INV-2024-001
        Date: January 15, 2024
        Due Date: February 15, 2024
        
        Bill To:
        Acme Corporation
        123 Business St
        City, State 12345
        
        From:
        Supplier Inc.
        456 Vendor Ave
        Vendor City, State 67890
        Tax ID: 12-3456789
        
        Description          Qty    Unit Price    Total
        Product A            10     $25.00        $250.00
        Product B            5      $50.00        $250.00
        Service Fee          1      $100.00       $100.00
        
        Subtotal:                                 $600.00
        Tax (8.5%):                              $51.00
        Total:                                   $651.00
      `,
      receipt: `
        Store Receipt
        ABC Retail Store
        123 Main St, City, State
        Phone: (555) 123-4567
        
        Date: 2024-01-15 14:30:25
        Transaction #: 789456123
        
        Item 1                    $12.99
        Item 2                    $8.50
        Item 3                    $15.75
        
        Subtotal:                 $37.24
        Tax:                      $2.98
        Total:                    $40.22
        
        Payment: Credit Card
        Thank you for shopping!
      `
    };

    return mockTexts.invoice; // Default to invoice for demo
  }

  private async classifyDocument(text: string, suggestedType?: string): Promise<{
    type: DocumentAnalysis['documentType'];
    confidence: number;
  }> {
    if (suggestedType) {
      return { type: suggestedType as DocumentAnalysis['documentType'], confidence: 0.95 };
    }

    // Simple classification based on keywords
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('invoice') && lowerText.includes('total')) {
      return { type: 'invoice', confidence: 0.9 };
    }
    
    if (lowerText.includes('receipt') && lowerText.includes('transaction')) {
      return { type: 'receipt', confidence: 0.85 };
    }
    
    if (lowerText.includes('contract') && lowerText.includes('agreement')) {
      return { type: 'contract', confidence: 0.8 };
    }
    
    return { type: 'unknown', confidence: 0.5 };
  }

  private async extractEntities(text: string): Promise<DocumentEntity[]> {
    const entities: DocumentEntity[] = [];

    // Extract dates
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = text.match(dateRegex);
    if (dates) {
      dates.forEach(date => {
        entities.push({
          type: 'date',
          value: date,
          confidence: 0.9,
          boundingBox: { x: 0, y: 0, width: 100, height: 20 }
        });
      });
    }

    // Extract amounts
    const amountRegex = /\$[\d,]+\.?\d*/g;
    const amounts = text.match(amountRegex);
    if (amounts) {
      amounts.forEach(amount => {
        entities.push({
          type: 'amount',
          value: amount,
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width: 80, height: 20 }
        });
      });
    }

    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails) {
      emails.forEach(email => {
        entities.push({
          type: 'email',
          value: email,
          confidence: 0.98,
          boundingBox: { x: 0, y: 0, width: 200, height: 20 }
        });
      });
    }

    // Extract phone numbers
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      phones.forEach(phone => {
        entities.push({
          type: 'phone',
          value: phone,
          confidence: 0.9,
          boundingBox: { x: 0, y: 0, width: 120, height: 20 }
        });
      });
    }

    return entities;
  }

  private async extractTables(text: string): Promise<TableData[]> {
    const tables: TableData[] = [];

    // Simple table detection for invoice items
    const lines = text.split('\n');
    let tableStart = -1;
    let tableEnd = -1;

    // Find table boundaries
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('description') && line.includes('qty') && line.includes('price')) {
        tableStart = i;
      }
      if (tableStart !== -1 && (line.includes('subtotal') || line.includes('total'))) {
        tableEnd = i;
        break;
      }
    }

    if (tableStart !== -1 && tableEnd !== -1) {
      const headers = ['Description', 'Qty', 'Unit Price', 'Total'];
      const rows: string[][] = [];

      for (let i = tableStart + 1; i < tableEnd; i++) {
        const line = lines[i].trim();
        if (line && !line.toLowerCase().includes('subtotal')) {
          // Simple parsing - in production, use more sophisticated table detection
          const parts = line.split(/\s{2,}/); // Split on multiple spaces
          if (parts.length >= 3) {
            rows.push(parts);
          }
        }
      }

      if (rows.length > 0) {
        tables.push({
          headers,
          rows,
          confidence: 0.8,
          boundingBox: { x: 0, y: tableStart * 20, width: 500, height: rows.length * 20 }
        });
      }
    }

    return tables;
  }

  private async extractStructuredData(
    text: string,
    documentType: DocumentAnalysis['documentType'],
    entities: DocumentEntity[]
  ): Promise<Record<string, any>> {
    switch (documentType) {
      case 'invoice':
        return this.extractInvoiceData(text, entities);
      case 'receipt':
        return this.extractReceiptData(text, entities);
      case 'contract':
        return this.extractContractData(text, entities);
      default:
        return {};
    }
  }

  private extractInvoiceData(text: string, entities: DocumentEntity[]): InvoiceData {
    const amounts = entities.filter(e => e.type === 'amount').map(e => e.value);
    const dates = entities.filter(e => e.type === 'date').map(e => e.value);

    // Extract invoice number
    const invoiceMatch = text.match(/invoice\s*#?\s*([A-Z0-9-]+)/i);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1] : 'Unknown';

    // Parse amounts
    const numericAmounts = amounts.map(a => parseFloat(a.replace(/[$,]/g, '')));
    const total = Math.max(...numericAmounts);
    const subtotal = total * 0.9; // Approximate
    const tax = total - subtotal;

    return {
      invoiceNumber,
      date: dates[0] || new Date().toISOString().split('T')[0],
      dueDate: dates[1],
      vendor: {
        name: 'Supplier Inc.',
        address: '456 Vendor Ave, Vendor City, State 67890',
        taxId: '12-3456789'
      },
      customer: {
        name: 'Acme Corporation',
        address: '123 Business St, City, State 12345'
      },
      items: [
        { description: 'Product A', quantity: 10, unitPrice: 25.00, total: 250.00 },
        { description: 'Product B', quantity: 5, unitPrice: 50.00, total: 250.00 },
        { description: 'Service Fee', quantity: 1, unitPrice: 100.00, total: 100.00 }
      ],
      subtotal,
      tax,
      total,
      currency: 'USD'
    };
  }

  private extractReceiptData(text: string, entities: DocumentEntity[]): Record<string, any> {
    const amounts = entities.filter(e => e.type === 'amount').map(e => e.value);
    const dates = entities.filter(e => e.type === 'date').map(e => e.value);

    return {
      store: 'ABC Retail Store',
      date: dates[0] || new Date().toISOString().split('T')[0],
      transactionId: '789456123',
      items: [
        { name: 'Item 1', price: 12.99 },
        { name: 'Item 2', price: 8.50 },
        { name: 'Item 3', price: 15.75 }
      ],
      subtotal: 37.24,
      tax: 2.98,
      total: 40.22,
      paymentMethod: 'Credit Card'
    };
  }

  private extractContractData(text: string, entities: DocumentEntity[]): Record<string, any> {
    const dates = entities.filter(e => e.type === 'date').map(e => e.value);
    const amounts = entities.filter(e => e.type === 'amount').map(e => e.value);

    return {
      contractType: 'Service Agreement',
      effectiveDate: dates[0],
      expirationDate: dates[1],
      parties: ['Party A', 'Party B'],
      value: amounts[0],
      keyTerms: ['Term 1', 'Term 2', 'Term 3']
    };
  }

  async processInvoiceBatch(invoices: ArrayBuffer[]): Promise<{
    processed: number;
    totalAmount: number;
    vendors: string[];
    errors: string[];
  }> {
    let processed = 0;
    let totalAmount = 0;
    const vendors: string[] = [];
    const errors: string[] = [];

    for (const invoice of invoices) {
      try {
        const analysis = await this.analyzeDocument(invoice, 'invoice');
        if (analysis.documentType === 'invoice') {
          processed++;
          const invoiceData = analysis.extractedData as InvoiceData;
          totalAmount += invoiceData.total;
          if (!vendors.includes(invoiceData.vendor.name)) {
            vendors.push(invoiceData.vendor.name);
          }
        }
      } catch (error) {
        errors.push(`Failed to process invoice: ${error}`);
      }
    }

    return { processed, totalAmount, vendors, errors };
  }

  getDocumentAnalysis(documentId: string): DocumentAnalysis | null {
    return this.processedDocuments.get(documentId) || null;
  }

  searchDocuments(query: {
    documentType?: string;
    dateRange?: { start: string; end: string };
    amountRange?: { min: number; max: number };
    vendor?: string;
  }): DocumentAnalysis[] {
    return Array.from(this.processedDocuments.values()).filter(doc => {
      if (query.documentType && doc.documentType !== query.documentType) return false;
      
      if (query.dateRange) {
        const docDate = new Date(doc.timestamp);
        const startDate = new Date(query.dateRange.start);
        const endDate = new Date(query.dateRange.end);
        if (docDate < startDate || docDate > endDate) return false;
      }

      if (query.amountRange && doc.documentType === 'invoice') {
        const invoiceData = doc.extractedData as InvoiceData;
        if (invoiceData.total < query.amountRange.min || invoiceData.total > query.amountRange.max) {
          return false;
        }
      }

      if (query.vendor && doc.documentType === 'invoice') {
        const invoiceData = doc.extractedData as InvoiceData;
        if (!invoiceData.vendor.name.toLowerCase().includes(query.vendor.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }
}