import { Agent, AgentReputation } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export interface TaskExecutionRecord {
  agentId: string;
  success: boolean;
  verificationScore?: number; // 0 to 1
  latencyMs: number;
  costTokens: number;
  roleDomain: string;
  toolsUsed?: { toolName: string; success: boolean }[];
}

export class AgentReputationEngine {
  private reputations: Map<string, AgentReputation> = new Map();
  private history: Map<string, TaskExecutionRecord[]> = new Map();

  /**
   * Get default fresh reputation object
   */
  public getDefaultReputation(): AgentReputation {
    return {
      successRate: 1.0,
      verificationScore: 0.95,
      failureRate: 0.0,
      recoveryRate: 1.0,
      averageLatencyMs: 1200,
      averageCost: 500,
      toolReliability: 0.98,
      specializationScores: {
        Security: 85,
        Research: 85,
        Engineering: 85,
        Verification: 85,
        Executive: 90,
      },
      collaborationScore: 0.95,
      recentFailures: 0,
      taskCompletionRate: 1.0,
      score: 92,
    };
  }

  /**
   * Get agent reputation or initialize if missing
   */
  public getReputation(agentId: string): AgentReputation {
    if (!this.reputations.has(agentId)) {
      this.reputations.set(agentId, this.getDefaultReputation());
    }
    return this.reputations.get(agentId)!;
  }

  /**
   * Record task execution result and update metrics
   */
  public recordTaskExecution(record: TaskExecutionRecord): AgentReputation {
    const agentId = record.agentId;
    const rep = this.getReputation(agentId);

    if (!this.history.has(agentId)) {
      this.history.set(agentId, []);
    }
    const agentHistory = this.history.get(agentId)!;
    agentHistory.push(record);

    // Keep last 100 execution records
    if (agentHistory.length > 100) {
      agentHistory.shift();
    }

    const total = agentHistory.length;
    const successes = agentHistory.filter((h) => h.success).length;
    const failures = total - successes;

    rep.successRate = Number((successes / total).toFixed(3));
    rep.failureRate = Number((failures / total).toFixed(3));
    rep.taskCompletionRate = rep.successRate;

    // Update recent failures count
    const recent = agentHistory.slice(-10);
    rep.recentFailures = recent.filter((h) => !h.success).length;

    // Update average latency & cost
    const totalLatency = agentHistory.reduce((acc, h) => acc + h.latencyMs, 0);
    rep.averageLatencyMs = Math.round(totalLatency / total);

    const totalCost = agentHistory.reduce((acc, h) => acc + h.costTokens, 0);
    rep.averageCost = Math.round(totalCost / total);

    // Update verification score if provided
    if (typeof record.verificationScore === 'number') {
      const vRecords = agentHistory.filter((h) => typeof h.verificationScore === 'number');
      const vSum = vRecords.reduce((acc, h) => acc + (h.verificationScore || 0), 0);
      rep.verificationScore = Number((vSum / vRecords.length).toFixed(3));
    }

    // Update specialization score
    const domain = record.roleDomain || 'General';
    const domainRecords = agentHistory.filter((h) => h.roleDomain === domain);
    if (domainRecords.length > 0) {
      const domainSuccesses = domainRecords.filter((h) => h.success).length;
      const domainRatio = domainSuccesses / domainRecords.length;
      rep.specializationScores[domain] = Math.round(domainRatio * 100);
    }

    // Update tool reliability if recorded
    if (record.toolsUsed && record.toolsUsed.length > 0) {
      const allTools = agentHistory.flatMap((h) => h.toolsUsed || []);
      if (allTools.length > 0) {
        const successfulTools = allTools.filter((t) => t.success).length;
        rep.toolReliability = Number((successfulTools / allTools.length).toFixed(3));
      }
    }

    // Recalculate composite overall score (0 - 100)
    rep.score = Math.round(
      rep.successRate * 40 +
      rep.verificationScore * 30 +
      rep.toolReliability * 15 +
      rep.collaborationScore * 15 -
      rep.recentFailures * 5
    );
    rep.score = Math.max(0, Math.min(100, rep.score));

    messageBus.publish('AGENT_REPUTATION_UPDATED', 'AgentReputationEngine', {
      agentId,
      reputation: rep,
      lastExecutionSuccess: record.success,
    }, { agentId, severity: record.success ? 'info' : 'warning' });

    return rep;
  }

  /**
   * Record recovery attempt result
   */
  public recordRecoveryResult(agentId: string, recoveredSuccessfully: boolean): void {
    const rep = this.getReputation(agentId);
    if (recoveredSuccessfully) {
      rep.recoveryRate = Number(Math.min(1.0, rep.recoveryRate + 0.05).toFixed(2));
      if (rep.recentFailures > 0) rep.recentFailures--;
    } else {
      rep.recoveryRate = Number(Math.max(0.0, rep.recoveryRate - 0.1).toFixed(2));
      rep.recentFailures++;
    }

    rep.score = Math.round(
      rep.successRate * 40 +
      rep.verificationScore * 30 +
      rep.toolReliability * 15 +
      rep.collaborationScore * 15 -
      rep.recentFailures * 5
    );
    rep.score = Math.max(0, Math.min(100, rep.score));

    messageBus.publish('AGENT_REPUTATION_UPDATED', 'AgentReputationEngine', {
      agentId,
      reputation: rep,
      recoveredSuccessfully,
    }, { agentId, severity: recoveredSuccessfully ? 'info' : 'error' });
  }

  /**
   * Calculate agent suitability fit score for task assignment (0 to 100)
   */
  public calculateFitScore(
    agent: Agent,
    requiredRole: string,
    requiredCapabilities: string[] = []
  ): number {
    const rep = this.getReputation(agent.id);

    // 1. Role match bonus
    let roleBonus = 0;
    if (agent.role.toLowerCase() === requiredRole.toLowerCase()) {
      roleBonus = 35;
    } else if (
      (requiredRole === 'Developer' && agent.role === 'SecurityAgent') ||
      (requiredRole === 'Critic' && agent.role === 'Reviewer')
    ) {
      roleBonus = 20;
    }

    // 2. Capability match ratio (up to 35 pts)
    let capabilityScore = 0;
    if (requiredCapabilities.length > 0) {
      const matches = requiredCapabilities.filter((c) =>
        agent.capabilities.some((ac) => ac.toLowerCase() === c.toLowerCase())
      );
      capabilityScore = Math.round((matches.length / requiredCapabilities.length) * 35);
    } else {
      capabilityScore = 25;
    }

    // 3. Domain specialization score (up to 20 pts)
    const domainScore = (rep.specializationScores[requiredRole] || 80) * 0.2;

    // 4. General reputation modifier (up to 10 pts)
    const repModifier = (rep.score / 100) * 10;

    // Penalty for recent failures
    const failurePenalty = rep.recentFailures * 5;

    const total = Math.round(roleBonus + capabilityScore + domainScore + repModifier - failurePenalty);
    return Math.max(0, Math.min(100, total));
  }
}

export const agentReputationEngine = new AgentReputationEngine();
