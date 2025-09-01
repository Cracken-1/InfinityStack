export interface GPUResource {
  id: string;
  name: string;
  memory: number;
  utilization: number;
  temperature: number;
  available: boolean;
  allocatedTo?: string;
}

export interface ComputeJob {
  id: string;
  type: 'training' | 'inference' | 'batch_processing';
  modelId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resourceRequirements: {
    gpu?: number;
    cpu: number;
    memory: number;
  };
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
}

export class GPUManager {
  private gpus: Map<string, GPUResource> = new Map();
  private jobQueue: ComputeJob[] = [];
  private runningJobs: Map<string, ComputeJob> = new Map();

  constructor() {
    this.initializeGPUs();
    this.startScheduler();
  }

  private initializeGPUs(): void {
    // Simulate available GPU resources
    const gpuConfigs = [
      { name: 'NVIDIA RTX 4090', memory: 24576 },
      { name: 'NVIDIA A100', memory: 40960 },
      { name: 'NVIDIA V100', memory: 32768 }
    ];

    gpuConfigs.forEach((config, index) => {
      const gpu: GPUResource = {
        id: `gpu-${index}`,
        name: config.name,
        memory: config.memory,
        utilization: 0,
        temperature: 35 + Math.random() * 10,
        available: true
      };
      this.gpus.set(gpu.id, gpu);
    });
  }

  submitJob(job: Omit<ComputeJob, 'id' | 'status'>): ComputeJob {
    const newJob: ComputeJob = {
      ...job,
      id: crypto.randomUUID(),
      status: 'queued'
    };

    // Insert job based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.jobQueue.findIndex(
      queuedJob => priorityOrder[queuedJob.priority] > priorityOrder[newJob.priority]
    );

    if (insertIndex === -1) {
      this.jobQueue.push(newJob);
    } else {
      this.jobQueue.splice(insertIndex, 0, newJob);
    }

    return newJob;
  }

  private startScheduler(): void {
    setInterval(() => {
      this.scheduleJobs();
      this.updateGPUMetrics();
    }, 1000);
  }

  private scheduleJobs(): void {
    while (this.jobQueue.length > 0) {
      const job = this.jobQueue[0];
      const allocatedResources = this.allocateResources(job);

      if (allocatedResources) {
        this.jobQueue.shift();
        job.status = 'running';
        job.startTime = new Date().toISOString();
        this.runningJobs.set(job.id, job);

        // Simulate job execution
        setTimeout(() => {
          this.completeJob(job.id, allocatedResources);
        }, job.estimatedDuration);

        break; // Process one job at a time for simplicity
      } else {
        break; // No resources available
      }
    }
  }

  private allocateResources(job: ComputeJob): { gpuIds: string[] } | null {
    const requiredGPUs = job.resourceRequirements.gpu || 0;
    
    if (requiredGPUs === 0) {
      return { gpuIds: [] }; // CPU-only job
    }

    const availableGPUs = Array.from(this.gpus.values())
      .filter(gpu => gpu.available && gpu.memory >= job.resourceRequirements.memory)
      .slice(0, requiredGPUs);

    if (availableGPUs.length < requiredGPUs) {
      return null; // Not enough resources
    }

    // Allocate GPUs
    availableGPUs.forEach(gpu => {
      gpu.available = false;
      gpu.allocatedTo = job.id;
      gpu.utilization = 70 + Math.random() * 30; // Simulate usage
    });

    return { gpuIds: availableGPUs.map(gpu => gpu.id) };
  }

  private completeJob(jobId: string, allocatedResources: { gpuIds: string[] }): void {
    const job = this.runningJobs.get(jobId);
    if (!job) return;

    job.status = Math.random() > 0.1 ? 'completed' : 'failed';
    job.endTime = new Date().toISOString();

    // Release resources
    allocatedResources.gpuIds.forEach(gpuId => {
      const gpu = this.gpus.get(gpuId);
      if (gpu) {
        gpu.available = true;
        gpu.allocatedTo = undefined;
        gpu.utilization = 0;
      }
    });

    this.runningJobs.delete(jobId);
  }

  private updateGPUMetrics(): void {
    this.gpus.forEach(gpu => {
      // Simulate temperature changes
      if (gpu.utilization > 50) {
        gpu.temperature = Math.min(85, gpu.temperature + Math.random() * 2);
      } else {
        gpu.temperature = Math.max(35, gpu.temperature - Math.random());
      }
    });
  }

  getGPUStatus(): GPUResource[] {
    return Array.from(this.gpus.values());
  }

  getJobStatus(jobId: string): ComputeJob | null {
    return this.runningJobs.get(jobId) || 
           this.jobQueue.find(job => job.id === jobId) || null;
  }

  getQueueStatus(): {
    queued: number;
    running: number;
    totalGPUs: number;
    availableGPUs: number;
    avgWaitTime: number;
  } {
    const availableGPUs = Array.from(this.gpus.values()).filter(gpu => gpu.available).length;
    
    return {
      queued: this.jobQueue.length,
      running: this.runningJobs.size,
      totalGPUs: this.gpus.size,
      availableGPUs,
      avgWaitTime: this.calculateAvgWaitTime()
    };
  }

  private calculateAvgWaitTime(): number {
    // Estimate based on queue length and average job duration
    const avgJobDuration = 300000; // 5 minutes
    return this.jobQueue.length * avgJobDuration / Math.max(1, this.gpus.size);
  }

  optimizeResourceAllocation(): {
    recommendations: string[];
    potentialSavings: number;
    efficiency: number;
  } {
    const recommendations: string[] = [];
    let efficiency = 0;

    const totalUtilization = Array.from(this.gpus.values())
      .reduce((sum, gpu) => sum + gpu.utilization, 0) / this.gpus.size;

    efficiency = totalUtilization / 100;

    if (totalUtilization < 30) {
      recommendations.push('Consider scaling down GPU resources during low usage');
    }

    if (this.jobQueue.length > 5) {
      recommendations.push('Queue is building up - consider adding more GPU resources');
    }

    const highTempGPUs = Array.from(this.gpus.values()).filter(gpu => gpu.temperature > 80);
    if (highTempGPUs.length > 0) {
      recommendations.push('Some GPUs are running hot - check cooling systems');
    }

    return {
      recommendations,
      potentialSavings: (100 - totalUtilization) * 0.01 * 1000, // Mock savings calculation
      efficiency
    };
  }

  async preemptJob(jobId: string, reason: string): Promise<void> {
    const job = this.runningJobs.get(jobId);
    if (!job) throw new Error('Job not found or not running');

    // Release resources
    const allocatedGPUs = Array.from(this.gpus.values())
      .filter(gpu => gpu.allocatedTo === jobId);

    allocatedGPUs.forEach(gpu => {
      gpu.available = true;
      gpu.allocatedTo = undefined;
      gpu.utilization = 0;
    });

    // Move job back to queue with higher priority
    job.status = 'queued';
    job.priority = 'high';
    delete job.startTime;
    
    this.runningJobs.delete(jobId);
    this.jobQueue.unshift(job); // Add to front of queue
  }
}