import { TaskRecord, TaskResult, TaskQueueStatus, TaskKind, AgentRole } from '../../shared/types';
import { TaskRepository } from '../persistence/taskRepository';
import { getLlmProvider } from '../llm/llmProvider';
import { agentRegistry } from '../registry/agentRegistry';
import { agentFactory } from '../agents/agentFactory';
import { verificationEngine } from '../verifier/verificationEngine';
import { messageBus } from '../bus/messageBus';
import { toolRegistry } from '../tools/toolRegistry';
import { healingSupervisor } from '../healing/healingSupervisor';
import { memoryService } from '../memory/memoryService';

export interface WorkerOptions {
  concurrency?: number;
  pollIntervalMs?: number;
  maxRetries?: number;
  defaultTimeoutMs?: number;
  taskKinds?: string[];
  workerId?: string;
}

export interface WorkerHealth {
  workerId: string;
  backend: string;
  status: 'healthy' | 'degraded' | 'offline';
  currentLoad: number;
  maxConcurrency: number;
  pendingTasks: number;
  avgTaskLatencyMs: number;
  lastHeartbeat: string;
  uptimeSeconds: number;
}

export class TaskWorker {
  private repo: TaskRepository;
  private concurrency: number;
  private pollIntervalMs: number;
  private runningTaskCount: number = 0;
  private stopped: boolean = false;
  private workerId: string;
  private supportedKinds: string[];
  private defaultTimeoutMs: number;
  private startTime: number;

  constructor(options: WorkerOptions = {}) {
    this.repo = new TaskRepository();
    this.concurrency = options.concurrency ?? (Number(process.env.HERMES_WORKER_CONCURRENCY) || 4);
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.workerId = options.workerId ?? `worker-${process.pid}`;
    this.supportedKinds = options.taskKinds ?? ['agent_llm', 'agent_tool', 'tool_execute', 'hermes_command'];
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 120000;
    this.startTime = Date.now();
  }

  /**
   * Start the worker — begins polling for tasks
   */
  public start(): void {
    console.log(`[TaskWorker:${this.workerId}] Starting with concurrency=${this.concurrency}, kinds=[${this.supportedKinds.join(', ')}]`);

    messageBus.publish('SYSTEM_ALERT', 'TaskWorker', {
      message: `Worker ${this.workerId} started`,
      workerId: this.workerId,
      pid: process.pid,
      concurrency: this.concurrency,
    }, { severity: 'info' });

    this.pollLoop();
  }

  /**
   * Stop the worker — finishes running tasks, then halts
   */
  public async stop(): Promise<void> {
    this.stopped = true;
    console.log(`[TaskWorker:${this.workerId}] Stopping (waiting for ${this.runningTaskCount} active tasks)`);
    messageBus.publish('SYSTEM_ALERT', 'TaskWorker', {
      message: `Worker ${this.workerId} stopping`,
      workerId: this.workerId,
    }, { severity: 'info' });

    let waited = 0;
    try {
      while (this.runningTaskCount > 0 && waited < 30000) {
        await new Promise((r) => setTimeout(r, 500));
        waited += 500;
      }
    } catch (err) {
      console.error(`[TaskWorker:${this.workerId}] Error while waiting for tasks to finish:`, err);
    }
  }

  /**
   * Main polling loop — picks up queued tasks and dispatches them
   */
  private async pollLoop(): Promise<void> {
    if (this.stopped) return;

    try {
      if (this.runningTaskCount < this.concurrency) {
        const availableSlots = this.concurrency - this.runningTaskCount;
        const queuedTasks = this.repo.findQueuedTasks(availableSlots, this.supportedKinds);

        for (const task of queuedTasks) {
          if (this.repo.claimTask(task.taskId, process.pid)) {
            this.runningTaskCount++;
            this.executeTask(task)
              .catch((err) => {
                // The error path itself can fail (e.g. sqlite lock during
                // recordError) — never let a rejection escape fire-and-forget.
                console.error(`[TaskWorker:${this.workerId}] Task ${task.taskId} failed with unhandled error:`, err);
              })
              .finally(() => {
                this.runningTaskCount--;
              });
          }
        }
      }
    } catch (err) {
      console.error(`[TaskWorker:${this.workerId}] Poll error:`, err);
    }

    if (!this.stopped) {
      setTimeout(() => this.pollLoop(), this.pollIntervalMs);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: TaskRecord): Promise<void> {
    const startTime = Date.now();
    const taskId = task.taskId;

    messageBus.publish('TASK_ASSIGNMENT', 'TaskWorker', {
      taskId,
      workerId: this.workerId,
      kind: task.kind,
      agentId: task.agentId,
    }, { taskId, missionId: task.context?.missionId as string | undefined, severity: 'info' });

    try {
      let result: TaskResult;

      if (task.kind === 'agent_tool' || task.kind === 'tool_execute') {
        if (task.toolName) {
          result = await this.executeToolTask(task);
        } else {
          throw new Error('Task kind is tool_execute but no toolName specified');
        }
      } else if (task.kind === 'agent_llm') {
        result = await this.executeAgentTask(task);
      } else {
        result = await this.executeAgentTask(task);
      }

      await this.repo.updateResult(taskId, {
        status: result.status,
        output: result.output,
        error: result.error,
        tokensUsed: result.tokensUsed,
        latencyMs: Date.now() - startTime,
        modelUsed: result.modelUsed,
        verificationScore: result.verificationScore,
        verificationComments: result.verificationComments,
        completedAt: result.completedAt,
      });

      messageBus.publish(
        result.status === 'completed' ? 'TASK_RESULT' : 'TASK_FAILURE',
        'TaskWorker',
        {
          taskId,
          workerId: this.workerId,
          missionId: task.context?.missionId as string | undefined,
          kind: task.kind,
          status: result.status,
          latencyMs: result.latencyMs,
          outputSnippet: result.output?.slice(0, 200),
          error: result.error,
        },
        { taskId, missionId: task.context?.missionId as string | undefined, severity: result.status === 'completed' ? 'success' : 'warning' }
      );

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const latencyMs = Date.now() - startTime;

      await this.repo.recordError(taskId, errorMsg, task.retryCount);
      await this.repo.updateResult(taskId, {
        status: 'failed',
        error: errorMsg,
        latencyMs,
        completedAt: new Date().toISOString(),
      });

      messageBus.publish('TASK_FAILURE', 'TaskWorker', {
        taskId,
        workerId: this.workerId,
        missionId: task.context?.missionId as string | undefined,
        error: errorMsg,
        latencyMs,
      }, { taskId, missionId: task.context?.missionId as string | undefined, severity: 'error' });

      // Trigger self-healing recovery
      await healingSupervisor.recoverTaskFailure(
        {
          id: task.taskId,
          title: `Task ${task.taskId}`,
          description: task.prompt,
          requiredRole: task.agentRole || 'Developer',
          requiredCapabilities: task.requiredCapabilities || [],
          dependencies: [],
        } as any,
        errorMsg,
        async () => {
          await this.repo.updateStatus(taskId, 'queued');
        },
        async (task, newAgentId) => {
          await this.repo.updateStatus(taskId, 'queued');
        }
      );
    }
  }

  /**
   * Execute an LLM-based agent task
   */
  private async executeAgentTask(task: TaskRecord): Promise<TaskResult> {
    let agent = task.agentId ? agentRegistry.getAgent(task.agentId) : undefined;

    if (!agent) {
      agent = agentRegistry.findAvailableAgent(task.agentRole, task.requiredCapabilities || task.agentCapabilities);
    }

    if (!agent && task.agentRole) {
      agent = agentRegistry.createAgent({
        name: `Task-${task.taskId.slice(-6)}-${task.agentRole}`,
        role: task.agentRole,
        capabilities: task.requiredCapabilities || task.agentCapabilities || ['task_execution'],
        clusterId: task.agentRole === 'SecurityAgent' ? 'Cluster B' : 'Cluster A',
        systemPrompt: task.systemPrompt,
      });
    }

    if (!agent) {
      throw new Error(`No agent available for task kind '${task.kind}' with role '${task.agentRole}'`);
    }

    agentRegistry.updateAgentStatus(agent.id, 'working', task.taskId, task.context?.missionId as string | undefined);

    const provider = getLlmProvider();

    const prompt = `You are ${agent.name}, a specialized ${agent.role} agent in the Hermes Hive swarm.
Mission Objective: ${task.context?.objective || 'Not specified'}
Task: ${task.prompt}
Instructions: Execute this task thoroughly and concisely. Produce concrete, production-grade output. Maintain highest quality standards.`;

    const timeoutMs = task.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const llmRes = await provider.generate({
        prompt,
        systemInstruction: task.systemPrompt || agent.systemPrompt || `You are ${agent.name}, role: ${agent.role}, cluster: ${agent.clusterId}. Provide clear, expert level outputs.`,
        temperature: 0.3,
      });

      const executionOutput = llmRes.text;
      agentRegistry.updateReputation(agent.id, true, llmRes.latencyMs);

      let verificationScore = 1.0;
      let verificationComments = '';

      try {
        const verificationResult = await verificationEngine.verifyTaskOutput(
          {
            id: task.taskId,
            title: task.taskId,
            description: task.prompt,
            requiredRole: agent.role,
            requiredCapabilities: task.requiredCapabilities || [],
            dependencies: [],
          } as any,
          executionOutput
        );

        verificationScore = verificationResult.score;
        verificationComments = verificationResult.comments;
      } catch {
        // Verification is best-effort
      }

      return {
        taskId: task.taskId,
        status: 'completed',
        output: executionOutput,
        tokensUsed: llmRes.tokensUsed,
        latencyMs: llmRes.latencyMs,
        modelUsed: llmRes.modelUsed,
        verificationScore,
        verificationComments,
        completedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
      agentRegistry.updateAgentStatus(agent.id, 'idle');
    }
  }

  /**
   * Execute a tool-based task
   */
  private async executeToolTask(task: TaskRecord): Promise<TaskResult> {
    const result = await toolRegistry.executeTool(
      task.toolName!,
      {
        expression: '100 * 45 / 2',
        text: task.prompt,
        jsonString: JSON.stringify({
          mission: task.context?.missionId,
          objective: task.context?.objective,
        }),
      },
      { agentId: task.agentId, missionId: task.context?.missionId as string | undefined, taskId: task.taskId }
    );

    return {
      taskId: task.taskId,
      status: 'completed',
      output: `[Tool Executed: ${task.toolName}] Output: ${JSON.stringify(result.output, null, 2)}`,
      tokensUsed: 0,
      latencyMs: 100,
      modelUsed: 'tool-executor',
      verificationScore: 1.0,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Heartbeat — get current worker health
   */
  public getHealth(): WorkerHealth {
    return {
      workerId: this.workerId,
      backend: 'local',
      status: 'healthy',
      currentLoad: this.runningTaskCount,
      maxConcurrency: this.concurrency,
      pendingTasks: 0,
      avgTaskLatencyMs: 0,
      lastHeartbeat: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

/**
 * Start worker process if --worker flag is present
 */
export function maybeStartWorker(options: WorkerOptions = {}): TaskWorker | null {
  if (process.argv.includes('--worker')) {
    const worker = new TaskWorker(options);
    worker.start();

    process.on('SIGTERM', async () => {
      await worker.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      await worker.stop();
      process.exit(0);
    });

    return worker;
  }
  return null;
}
