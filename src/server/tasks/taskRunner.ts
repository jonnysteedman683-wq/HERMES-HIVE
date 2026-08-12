import {
  TaskSpec,
  TaskRecord,
  TaskResult,
  TaskQueueStatus,
  TaskKind,
  WorkerRegistration,
  HiveEvent,
} from '../../shared/types';
import { TaskRepository } from '../persistence/taskRepository';
import { messageBus } from '../bus/messageBus';

// Fallback UUID generation if uuid isn't available
function generateId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_RETRY_POLICY = {
  maxRetries: 3,
  backoffMs: 5000,
  backoffMultiplier: 2,
  maxBackoffMs: 60000,
};

export class TaskRunnerService {
  private repo: TaskRepository;
  private pendingWaits: Map<string, { resolve: (r: TaskResult) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout }>;
  private workers: Map<string, WorkerRegistration>;

  constructor() {
    this.repo = new TaskRepository();
    this.pendingWaits = new Map();
    this.workers = new Map();

    // Listen for task completion events to resolve pending awaitResult calls
    messageBus.subscribe((event: HiveEvent) => {
      if (event.type === 'TASK_RESULT' || event.type === 'TASK_FAILURE') {
        const taskId = event.taskId;
        if (taskId && this.pendingWaits.has(taskId)) {
          const waiter = this.pendingWaits.get(taskId)!;
          clearTimeout(waiter.timeout);
          this.pendingWaits.delete(taskId);

          const task = this.repo.get(taskId);
          if (task) {
            waiter.resolve({
              taskId,
              status: task.status === 'completed' ? 'completed' : 'failed',
              output: task.output,
              error: task.error,
              tokensUsed: task.tokensUsed,
              latencyMs: task.latencyMs,
              modelUsed: task.modelUsed,
              verificationScore: task.verificationScore,
              verificationComments: task.verificationComments,
              completedAt: task.completedAt || new Date().toISOString(),
            });
          }
        }
      }
    }, { pattern: 'TASK_*' });
  }

  /**
   * Submit a task to the queue — returns the task ID immediately
   */
  async submitTask(spec: TaskSpec): Promise<string> {
    try {
      const taskId = spec.taskId || generateId();

      const record: TaskRecord = {
        id: taskId,
        taskId,
        kind: spec.kind,
        agentId: spec.agentId,
        agentRole: spec.agentRole,
        agentCapabilities: spec.agentCapabilities,
        systemPrompt: spec.systemPrompt,
        prompt: spec.prompt,
        toolName: spec.toolName,
        toolArgs: spec.toolArgs,
        requiredCapabilities: spec.requiredCapabilities,
        timeoutMs: spec.timeoutMs,
        retryPolicy: spec.retryPolicy || DEFAULT_RETRY_POLICY,
        priority: spec.priority || 3,
        context: spec.context,
        status: 'queued',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errorHistory: [],
      };

      this.repo.upsert(record);

      messageBus.publish('TASK_ASSIGNMENT', 'TaskRunnerService', {
        taskId,
        kind: spec.kind,
        priority: record.priority,
        agentId: spec.agentId,
        missionId: spec.context?.missionId as string | undefined,
      }, { taskId, missionId: spec.context?.missionId as string | undefined, severity: 'info' });

      return taskId;
    } catch (err) {
      console.error('[TaskRunnerService.submitTask] Failed:', err);
      throw err;
    }
  }

  /**
   * Create and submit a task from a simplified spec
   */
  async createTask(params: {
    kind: TaskKind;
    prompt: string;
    agentRole?: import('../../shared/types').AgentRole;
    agentId?: string;
    requiredCapabilities?: string[];
    systemPrompt?: string;
    context?: { missionId?: string; objective?: string; [key: string]: unknown };
    timeoutMs?: number;
    priority?: number;
    retryPolicy?: { maxRetries?: number; backoffMs?: number; backoffMultiplier?: number; maxBackoffMs?: number };
  }): Promise<string> {
    return this.submitTask({
      taskId: generateId(),
      kind: params.kind,
      prompt: params.prompt,
      agentRole: params.agentRole,
      agentId: params.agentId,
      requiredCapabilities: params.requiredCapabilities,
      systemPrompt: params.systemPrompt,
      timeoutMs: params.timeoutMs,
      retryPolicy: params.retryPolicy ? {
        maxRetries: params.retryPolicy.maxRetries || 3,
        backoffMs: params.retryPolicy.backoffMs || 5000,
        backoffMultiplier: params.retryPolicy.backoffMultiplier || 2,
        maxBackoffMs: params.retryPolicy.maxBackoffMs || 60000,
      } : DEFAULT_RETRY_POLICY,
      priority: params.priority || 3,
      context: params.context || {},
    });
  }

  /**
   * Wait for a task to complete — returns result or throws on timeout
   */
  async awaitResult(taskId: string, timeoutMs: number = 120000): Promise<TaskResult> {
    // Check if already completed
    try {
      const existing = this.repo.get(taskId);
      if (existing && (existing.status === 'completed' || existing.status === 'failed')) {
        return {
          taskId,
          status: existing.status === 'completed' ? 'completed' : 'failed',
          output: existing.output,
          error: existing.error,
          tokensUsed: existing.tokensUsed,
          latencyMs: existing.latencyMs,
          modelUsed: existing.modelUsed,
          verificationScore: existing.verificationScore,
          verificationComments: existing.verificationComments,
          completedAt: existing.completedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error(`[TaskRunnerService.awaitResult] Failed to fetch task ${taskId}:`, err);
      throw err;
    }

    // Wait for completion
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingWaits.delete(taskId);
        reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingWaits.set(taskId, { resolve, reject, timeout });
    });
  }

  /**
   * Cancel a running or queued task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const task = this.repo.get(taskId);
      if (!task) return false;

      if (task.status === 'completed' || task.status === 'cancelled') {
        return false;
      }

      // For running tasks, we can't truly kill a worker — mark as cancelled
      // and signal to the worker to abort
      this.repo.updateStatus(taskId, 'cancelled');

      messageBus.publish('SYSTEM_ALERT', 'TaskRunnerService', {
        message: `Task ${taskId} cancelled by operator`,
        taskId,
        missionId: task.context?.missionId as string | undefined,
      }, { taskId, missionId: task.context?.missionId as string | undefined, severity: 'warning' });

      return true;
    } catch (err) {
      console.error(`[TaskRunnerService.cancelTask] Failed for task ${taskId}:`, err);
      throw err;
    }
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<boolean> {
    try {
      const task = this.repo.get(taskId);
      if (!task) return false;

      if (task.retryCount >= (task.retryPolicy?.maxRetries || 3)) {
        return false;
      }

      this.repo.updateStatus(taskId, 'queued');
      messageBus.publish('TASK_ASSIGNMENT', 'TaskRunnerService', {
        taskId,
        action: 'retry',
        retryCount: task.retryCount + 1,
      }, { taskId, missionId: task.context?.missionId as string | undefined, severity: 'info' });

      return true;
    } catch (err) {
      console.error(`[TaskRunnerService.retryTask] Failed for task ${taskId}:`, err);
      throw err;
    }
  }

  /**
   * Get task status
   */
  getTask(taskId: string): TaskRecord | undefined {
    return this.repo.get(taskId);
  }

  /**
   * List tasks with filtering
   */
  listTasks(filter?: {
    status?: TaskQueueStatus | TaskQueueStatus[];
    missionId?: string;
    agentId?: string;
    kind?: string | string[];
    limit?: number;
  }) {
    return this.repo.query({
      status: filter?.status,
      missionId: filter?.missionId,
      agentId: filter?.agentId,
      kind: filter?.kind,
      limit: filter?.limit,
    });
  }

  /**
   * Get task statistics
   */
  getStats() {
    return this.repo.getStats();
  }

  /**
   * Register a worker (for distributed deployments)
   */
  registerWorker(reg: WorkerRegistration): void {
    this.workers.set(reg.workerId, reg);
    this.repo.upsertWorker(reg);
  }

  /**
   * List active workers
   */
  getWorkers(): any[] {
    return this.repo.getWorkers();
  }

  /**
   * Health check for all backends
   */
  getBackendHealth(): Record<string, { status: string; detail?: string }> {
    const stats = this.getStats();
    return {
      local: { status: 'ok', detail: `Tasks: ${stats.total} total, ${stats.queued} queued, ${stats.running} running` },
      ...this.workers.size > 0
        ? { [`worker-${this.workers.size}`]: { status: 'ok', detail: 'registered' } }
        : {},
    };
  }
}

export const taskRunner = new TaskRunnerService();
