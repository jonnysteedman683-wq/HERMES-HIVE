import { MissionTask } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { messageBus } from '../bus/messageBus';

class HealingSupervisor {
  private timer: NodeJS.Timeout | null = null;
  public totalRecoveries = 0;

  constructor() {
    this.startHealthChecks();
  }

  public startHealthChecks() {
    if (this.timer) clearInterval(this.timer);
    // Run health check every 15 seconds. Guarded: a throw inside a timer
    // callback is an uncaught exception and would crash the whole process.
    this.timer = setInterval(() => {
      try {
        this.checkAgentHeartbeats();
      } catch (err) {
        console.error('[HealingSupervisor] Health check failed:', err);
      }
    }, 15000);
  }

  public stopHealthChecks() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private checkAgentHeartbeats() {
    const agents = agentRegistry.getAllAgents();
    const now = Date.now();

    agents.forEach((agent) => {
      if (agent.status === 'terminated' || agent.status === 'paused') return;

      const lastMs = new Date(agent.lastHeartbeat).getTime();
      const diffSec = (now - lastMs) / 1000;

      if (diffSec > 60 && agent.status === 'working') {
        // Agent unresponsive
        agentRegistry.processHeartbeat(agent.id, 'unresponsive');
        messageBus.publish('SYSTEM_ALERT', 'HealingSupervisor', {
          alert: 'AGENT_UNRESPONSIVE',
          agentId: agent.id,
          agentName: agent.name,
          silentSeconds: Math.round(diffSec),
        }, { agentId: agent.id, severity: 'warning' });
      } else if (diffSec <= 30 && agent.health === 'unresponsive') {
        agentRegistry.processHeartbeat(agent.id, 'healthy');
      }
    });
  }

  public async recoverTaskFailure(
    task: MissionTask,
    failureReason: string,
    onRetryTask: (task: MissionTask) => Promise<void>,
    onReassignTask: (task: MissionTask, newAgentId: string) => Promise<void>
  ): Promise<boolean> {
    this.totalRecoveries++;
    const currentAgentId = task.assignedAgentId;

    messageBus.publish('HEALING_ACTION', 'HealingSupervisor', {
      phase: 'DETECT',
      taskId: task.id,
      missionId: task.missionId,
      taskTitle: task.title,
      failureReason,
      retryCount: task.retryCount,
      maxRetries: task.maxRetries,
    }, { missionId: task.missionId, taskId: task.id, severity: 'warning' });

    // Step 1: DIAGNOSE
    const isTimeout = failureReason.toLowerCase().includes('timeout') || failureReason.toLowerCase().includes('heartbeat');
    const isSyntaxOrFormat = failureReason.toLowerCase().includes('json') || failureReason.toLowerCase().includes('format');

    // Step 2: RETRY with same agent if retryCount < maxRetries
    if (task.retryCount < task.maxRetries) {
      task.retryCount++;
      messageBus.publish('HEALING_ACTION', 'HealingSupervisor', {
        phase: 'RETRY',
        taskId: task.id,
        attempt: task.retryCount,
        maxRetries: task.maxRetries,
        strategy: isSyntaxOrFormat ? 'Constrained format retry' : 'Immediate execution retry',
      }, { missionId: task.missionId, taskId: task.id, severity: 'info' });

      try {
        await onRetryTask(task);
        return true;
      } catch (err) {
        const retryErr = err instanceof Error ? err.message : String(err);
        console.warn(`[HealingSupervisor] Retry callback failed for task ${task.id}, falling back to reassign:`, retryErr);
        // Fall through to reassign/escalate path below.
      }
    }

    // Step 3: REASSIGN to new specialized agent
    messageBus.publish('HEALING_ACTION', 'HealingSupervisor', {
      phase: 'REASSIGN',
      taskId: task.id,
      previousAgentId: currentAgentId,
      reason: 'Max retries reached with current agent. Finding replacement agent.',
    }, { missionId: task.missionId, taskId: task.id, severity: 'warning' });

    if (currentAgentId) {
      agentRegistry.updateAgentStatus(currentAgentId, 'failed');
    }

    // Find replacement agent
    const replacementAgent = agentRegistry.findAvailableAgent(task.requiredRole, task.requiredCapabilities);

    if (replacementAgent) {
      task.retryCount = 0; // Reset for new agent
      messageBus.publish('HEALING_ACTION', 'HealingSupervisor', {
        phase: 'REPLACE',
        taskId: task.id,
        newAgentId: replacementAgent.id,
        newAgentName: replacementAgent.name,
      }, { missionId: task.missionId, taskId: task.id, severity: 'info' });

      try {
        await onReassignTask(task, replacementAgent.id);
        return true;
      } catch (err) {
        const reassignErr = err instanceof Error ? err.message : String(err);
        console.warn(`[HealingSupervisor] Reassign callback failed for task ${task.id}, escalating:`, reassignErr);
        // Fall through to escalate path below.
      }
    }

    // Step 4: ESCALATE to Hermes Executive
    messageBus.publish('HEALING_ACTION', 'HealingSupervisor', {
      phase: 'ESCALATE',
      taskId: task.id,
      missionId: task.missionId,
      message: 'Self-healing supervisor escalated task failure to Hermes Executive Engine.',
    }, { missionId: task.missionId, taskId: task.id, severity: 'error' });

    return false;
  }
}

export const healingSupervisor = new HealingSupervisor();
