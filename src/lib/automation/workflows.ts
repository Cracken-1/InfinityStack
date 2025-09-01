export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  nextSteps: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  active: boolean;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: string;
  context: Record<string, any>;
  startedAt: string;
  completedAt?: string;
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  async executeWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.active) {
      throw new Error('Workflow not found or inactive');
    }

    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflowId,
      status: 'running',
      currentStep: workflow.steps[0]?.id || '',
      context,
      startedAt: new Date().toISOString()
    };

    this.executions.set(execution.id, execution);

    try {
      await this.processWorkflow(execution, workflow);
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
    } catch (error) {
      execution.status = 'failed';
      console.error('Workflow execution failed:', error);
    }

    return execution;
  }

  private async processWorkflow(execution: WorkflowExecution, workflow: Workflow) {
    let currentStepId = execution.currentStep;

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) break;

      execution.currentStep = currentStepId;
      
      const result = await this.executeStep(step, execution.context);
      
      if (result.success) {
        // Merge result data into context
        execution.context = { ...execution.context, ...result.data };
        
        // Move to next step
        currentStepId = step.nextSteps[0] || '';
      } else {
        throw new Error(`Step ${step.name} failed: ${(result as any).error || 'Unknown error'}`);
      }
    }
  }

  private async executeStep(step: WorkflowStep, context: Record<string, any>) {
    switch (step.type) {
      case 'condition':
        return this.evaluateCondition(step.config, context);
      case 'action':
        return this.executeAction(step.config, context);
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, step.config.duration || 1000));
        return { success: true, data: {} };
      default:
        return { success: true, data: {} };
    }
  }

  private evaluateCondition(config: any, context: Record<string, any>) {
    // Simple condition evaluation
    const { field, operator, value } = config;
    const contextValue = context[field];

    let result = false;
    switch (operator) {
      case 'equals':
        result = contextValue === value;
        break;
      case 'greater_than':
        result = contextValue > value;
        break;
      case 'contains':
        result = String(contextValue).includes(value);
        break;
    }

    return { success: true, data: { conditionResult: result } };
  }

  private async executeAction(config: any, context: Record<string, any>) {
    // Execute various actions
    switch (config.type) {
      case 'send_email':
        console.log(`Sending email to ${config.to}: ${config.subject}`);
        break;
      case 'create_task':
        console.log(`Creating task: ${config.title}`);
        break;
      case 'update_record':
        console.log(`Updating record ${config.recordId}`);
        break;
    }

    return { success: true, data: { actionExecuted: config.type } };
  }

  getWorkflows(tenantId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter(w => w.tenantId === tenantId);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }
}