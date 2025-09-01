export interface CollaborativeDocument {
  id: string;
  content: string;
  version: number;
  tenantId: string;
  lastModified: string;
  activeUsers: string[];
}

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: string;
}

export class CollaborationManager {
  private documents: Map<string, CollaborativeDocument> = new Map();
  private operations: Map<string, Operation[]> = new Map();

  createDocument(tenantId: string, initialContent = ''): CollaborativeDocument {
    const doc: CollaborativeDocument = {
      id: crypto.randomUUID(),
      content: initialContent,
      version: 0,
      tenantId,
      lastModified: new Date().toISOString(),
      activeUsers: []
    };

    this.documents.set(doc.id, doc);
    this.operations.set(doc.id, []);
    return doc;
  }

  applyOperation(docId: string, operation: Omit<Operation, 'timestamp'>): CollaborativeDocument | null {
    const doc = this.documents.get(docId);
    if (!doc) return null;

    const fullOperation: Operation = {
      ...operation,
      timestamp: new Date().toISOString()
    };

    // Apply operation to document content
    let newContent = doc.content;
    switch (operation.type) {
      case 'insert':
        newContent = newContent.slice(0, operation.position) + 
                    (operation.content || '') + 
                    newContent.slice(operation.position);
        break;
      case 'delete':
        newContent = newContent.slice(0, operation.position) + 
                    newContent.slice(operation.position + (operation.length || 0));
        break;
    }

    // Update document
    doc.content = newContent;
    doc.version++;
    doc.lastModified = fullOperation.timestamp;

    // Store operation
    const docOps = this.operations.get(docId) || [];
    docOps.push(fullOperation);
    this.operations.set(docId, docOps);

    return doc;
  }

  joinDocument(docId: string, userId: string) {
    const doc = this.documents.get(docId);
    if (doc && !doc.activeUsers.includes(userId)) {
      doc.activeUsers.push(userId);
    }
  }

  leaveDocument(docId: string, userId: string) {
    const doc = this.documents.get(docId);
    if (doc) {
      doc.activeUsers = doc.activeUsers.filter(id => id !== userId);
    }
  }

  getDocument(docId: string): CollaborativeDocument | null {
    return this.documents.get(docId) || null;
  }
}