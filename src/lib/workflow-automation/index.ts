import { createClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  config: Record<string, any>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface Workflow {
  id: string
  tenantId: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  enabled: boolean
  createdAt: Date
}

class WorkflowEngine {
  private supabase = createClient()

  async executeWorkflow(workflowId: string, triggerData: Record<string, any>) {
    try {
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow?.enabled) return

      const context = { ...triggerData, workflowId, executionId: crypto.randomUUID() }
      await this.processNode(workflow, workflow.nodes[0], context)
    } catch (error) {
      logger.error('Workflow execution error:', error as Error)
    }
  }

  async createWorkflow(tenantId: string, workflow: Omit<Workflow, 'id' | 'createdAt'>): Promise<string> {
    const { data } = await this.supabase
      .from('workflows')
      .insert({ ...workflow, tenant_id: tenantId, created_at: new Date() })
      .select('id')
      .single()

    return data?.id
  }

  private async getWorkflow(id: string): Promise<Workflow | null> {
    const { data } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    return data
  }

  private async processNode(workflow: Workflow, node: WorkflowNode, context: Record<string, any>) {
    switch (node.type) {
      case 'trigger':
        await this.processTrigger(workflow, node, context)
        break
      case 'condition':
        await this.processCondition(workflow, node, context)
        break
      case 'action':
        await this.processAction(workflow, node, context)
        break
      case 'delay':
        await this.processDelay(workflow, node, context)
        break
    }
  }

  private async processTrigger(workflow: Workflow, node: WorkflowNode, context: Record<string, any>) {
    const nextNodes = this.getNextNodes(workflow, node.id)
    for (const nextNode of nextNodes) {
      await this.processNode(workflow, nextNode, context)
    }
  }

  private async processCondition(workflow: Workflow, node: WorkflowNode, context: Record<string, any>) {
    const result = this.evaluateCondition(node.config.condition, context)
    const edge = workflow.edges.find(e => e.source === node.id && e.condition === (result ? 'true' : 'false'))
    
    if (edge) {
      const nextNode = workflow.nodes.find(n => n.id === edge.target)
      if (nextNode) await this.processNode(workflow, nextNode, context)
    }
  }

  private async processAction(workflow: Workflow, node: WorkflowNode, context: Record<string, any>) {
    await this.executeAction(node.config.actionType, node.config, context)
    
    const nextNodes = this.getNextNodes(workflow, node.id)
    for (const nextNode of nextNodes) {
      await this.processNode(workflow, nextNode, context)
    }
  }

  private async processDelay(workflow: Workflow, node: WorkflowNode, context: Record<string, any>) {
    const delayMs = node.config.delay * 1000
    setTimeout(async () => {
      const nextNodes = this.getNextNodes(workflow, node.id)
      for (const nextNode of nextNodes) {
        await this.processNode(workflow, nextNode, context)
      }
    }, delayMs)
  }

  private getNextNodes(workflow: Workflow, nodeId: string): WorkflowNode[] {
    const edges = workflow.edges.filter(e => e.source === nodeId)
    return edges.map(e => workflow.nodes.find(n => n.id === e.target)).filter(Boolean) as WorkflowNode[]
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      return new Function('context', `return ${condition}`)(context)
    } catch {
      return false
    }
  }

  private async executeAction(actionType: string, config: Record<string, any>, context: Record<string, any>) {
    switch (actionType) {
      case 'send_email':
        await this.sendEmail(config.to, config.subject, config.body, context)
        break
      case 'create_task':
        await this.createTask(config.title, config.description, context)
        break
      case 'update_record':
        await this.updateRecord(config.table, config.id, config.data, context)
        break
      case 'webhook':
        await this.callWebhook(config.url, config.method, config.data, context)
        break
    }
  }

  private async sendEmail(to: string, subject: string, body: string, context: Record<string, any>) {
    // Email implementation
    logger.info('Email sent:', { to, subject })
  }

  private async createTask(title: string, description: string, context: Record<string, any>) {
    await this.supabase
      .from('tasks')
      .insert({
        tenant_id: context.tenantId,
        title: this.processTemplate(title, context),
        description: this.processTemplate(description, context),
        created_at: new Date()
      })
  }

  private async updateRecord(table: string, id: string, data: Record<string, any>, context: Record<string, any>) {
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? this.processTemplate(value, context) : value
      return acc
    }, {} as Record<string, any>)

    await this.supabase
      .from(table)
      .update(processedData)
      .eq('id', id)
  }

  private async callWebhook(url: string, method: string, data: Record<string, any>, context: Record<string, any>) {
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? this.processTemplate(value, context) : value
      return acc
    }, {} as Record<string, any>)

    await fetch(url, {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedData)
    })
  }

  private processTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] || match)
  }
}

export const workflowEngine = new WorkflowEngine()

// Predefined workflow templates
export const workflowTemplates = {
  welcome_new_customer: {
    name: 'Welcome New Customer',
    description: 'Send welcome email and create onboarding task',
    nodes: [
      { id: '1', type: 'trigger', config: { event: 'customer.created' }, position: { x: 0, y: 0 } },
      { id: '2', type: 'action', config: { actionType: 'send_email', to: '{{email}}', subject: 'Welcome!', body: 'Welcome {{name}}!' }, position: { x: 200, y: 0 } },
      { id: '3', type: 'action', config: { actionType: 'create_task', title: 'Onboard {{name}}', description: 'Follow up with new customer' }, position: { x: 400, y: 0 } }
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ]
  },
  low_inventory_alert: {
    name: 'Low Inventory Alert',
    description: 'Alert when inventory is low',
    nodes: [
      { id: '1', type: 'trigger', config: { event: 'inventory.updated' }, position: { x: 0, y: 0 } },
      { id: '2', type: 'condition', config: { condition: 'context.quantity < 10' }, position: { x: 200, y: 0 } },
      { id: '3', type: 'action', config: { actionType: 'send_email', to: 'admin@company.com', subject: 'Low Inventory Alert', body: '{{productName}} is low: {{quantity}} remaining' }, position: { x: 400, y: 0 } }
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3', condition: 'true' }
    ]
  }
}