export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  cron: string;
  action: {
    type: 'workflow' | 'function' | 'api_call';
    config: Record<string, any>;
  };
  active: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

export class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private executions: Map<string, TaskExecution> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  createTask(task: Omit<ScheduledTask, 'id' | 'createdAt' | 'nextRun'>): ScheduledTask {
    const newTask: ScheduledTask = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(task.cron)
    };

    this.tasks.set(newTask.id, newTask);

    if (newTask.active) {
      this.scheduleTask(newTask);
    }

    return newTask;
  }

  private scheduleTask(task: ScheduledTask) {
    // Simple interval-based scheduling (in production, use proper cron parser)
    const interval = this.parseCronToInterval(task.cron);
    
    const timeoutId = setInterval(async () => {
      await this.executeTask(task.id);
    }, interval);

    this.intervals.set(task.id, timeoutId);
  }

  async executeTask(taskId: string): Promise<TaskExecution> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const execution: TaskExecution = {
      id: crypto.randomUUID(),
      taskId,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.executions.set(execution.id, execution);

    try {
      let result;
      
      switch (task.action.type) {
        case 'workflow':
          result = await this.executeWorkflow(task.action.config);
          break;
        case 'function':
          result = await this.executeFunction(task.action.config);
          break;
        case 'api_call':
          result = await this.executeApiCall(task.action.config);
          break;
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.result = result;

      // Update task last run
      task.lastRun = execution.completedAt;
      task.nextRun = this.calculateNextRun(task.cron);

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return execution;
  }

  private async executeWorkflow(config: any) {
    console.log('Executing workflow:', config.workflowId);
    return { workflowExecuted: true };
  }

  private async executeFunction(config: any) {
    console.log('Executing function:', config.functionName);
    return { functionExecuted: true };
  }

  private async executeApiCall(config: any) {
    console.log('Making API call to:', config.url);
    // In production, make actual HTTP request
    return { apiCallMade: true, url: config.url };
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing - in production use proper cron library
    const parts = cron.split(' ');
    
    // Basic patterns
    if (cron === '0 * * * *') return 60 * 60 * 1000; // Every hour
    if (cron === '0 0 * * *') return 24 * 60 * 60 * 1000; // Daily
    if (cron === '*/5 * * * *') return 5 * 60 * 1000; // Every 5 minutes
    
    return 60 * 1000; // Default: every minute
  }

  private calculateNextRun(cron: string): string {
    // Simplified next run calculation
    const interval = this.parseCronToInterval(cron);
    return new Date(Date.now() + interval).toISOString();
  }

  pauseTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.active = false;
      const intervalId = this.intervals.get(taskId);
      if (intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(taskId);
      }
    }
  }

  resumeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.active = true;
      this.scheduleTask(task);
    }
  }

  getTasks(tenantId: string): ScheduledTask[] {
    return Array.from(this.tasks.values()).filter(t => t.tenantId === tenantId);
  }

  getTaskExecutions(taskId: string): TaskExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.taskId === taskId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
}