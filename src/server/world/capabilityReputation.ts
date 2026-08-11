import { CapabilityReputation } from './worldIntegrationTypes';
import { messageBus } from '../bus/messageBus';

export class CapabilityReputationEngine {
  private reputationCache: Map<string, CapabilityReputation> = new Map();
  private decayFactor = 0.95; // Time decay multiplier for historical observations

  constructor() {
    this.seedDefaultReputations();
  }

  private seedDefaultReputations(): void {
    const defaults: Omit<CapabilityReputation, 'lastUsedAt'>[] = [
      {
        capabilityId: 'web.search',
        successCount: 45,
        failureCount: 1,
        successRate: 0.978,
        avgLatencyMs: 450,
        consistencyScore: 94,
        accuracyScore: 92,
        reliabilityScore: 95,
        costPerUse: 5,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
      },
      {
        capabilityId: 'web.http_request',
        successCount: 120,
        failureCount: 4,
        successRate: 0.967,
        avgLatencyMs: 250,
        consistencyScore: 89,
        accuracyScore: 90,
        reliabilityScore: 92,
        costPerUse: 2,
        availability: 'online',
        unexpectedBehaviorsCount: 1,
      },
      {
        capabilityId: 'web.repository_read',
        successCount: 300,
        failureCount: 2,
        successRate: 0.993,
        avgLatencyMs: 120,
        consistencyScore: 98,
        accuracyScore: 99,
        reliabilityScore: 99,
        costPerUse: 1,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
      },
      {
        capabilityId: 'web.repository_write',
        successCount: 28,
        failureCount: 1,
        successRate: 0.965,
        avgLatencyMs: 800,
        consistencyScore: 85,
        accuracyScore: 96,
        reliabilityScore: 94,
        costPerUse: 15,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
      },
      {
        capabilityId: 'web.database_query',
        successCount: 88,
        failureCount: 2,
        successRate: 0.977,
        avgLatencyMs: 150,
        consistencyScore: 95,
        accuracyScore: 98,
        reliabilityScore: 97,
        costPerUse: 8,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
      },
      {
        capabilityId: 'web.saas_connector',
        successCount: 42,
        failureCount: 3,
        successRate: 0.933,
        avgLatencyMs: 650,
        consistencyScore: 82,
        accuracyScore: 88,
        reliabilityScore: 89,
        costPerUse: 10,
        availability: 'online',
        unexpectedBehaviorsCount: 2,
      },
      {
        capabilityId: 'web.system_command',
        successCount: 15,
        failureCount: 1,
        successRate: 0.937,
        avgLatencyMs: 180,
        consistencyScore: 90,
        accuracyScore: 95,
        reliabilityScore: 92,
        costPerUse: 20,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
      },
    ];

    const now = new Date().toISOString();
    for (const d of defaults) {
      this.reputationCache.set(d.capabilityId, {
        ...d,
        lastUsedAt: now,
      });
    }
  }

  public getReputation(capabilityId: string): CapabilityReputation {
    let rep = this.reputationCache.get(capabilityId);
    if (!rep) {
      rep = {
        capabilityId,
        successCount: 0,
        failureCount: 0,
        successRate: 1.0,
        avgLatencyMs: 300,
        consistencyScore: 100,
        accuracyScore: 100,
        reliabilityScore: 100,
        costPerUse: 5,
        availability: 'online',
        unexpectedBehaviorsCount: 0,
        lastUsedAt: new Date().toISOString(),
      };
      this.reputationCache.set(capabilityId, rep);
    }
    return rep;
  }

  /**
   * Applies a periodic time-decay to historical success/failure tracking
   * so reputation adjusts responsively to recent behavior changes.
   */
  public applyTimeDecay(): void {
    this.reputationCache.forEach((rep, capId) => {
      rep.successCount = Math.round(rep.successCount * this.decayFactor * 10) / 10;
      rep.failureCount = Math.round(rep.failureCount * this.decayFactor * 10) / 10;
      rep.unexpectedBehaviorsCount = Math.round(rep.unexpectedBehaviorsCount * this.decayFactor * 10) / 10;
      this.recomputeMetrics(rep);
    });

    messageBus.publish('REPUTATION_DECAY_APPLIED', 'ReputationEngine', {
      message: 'Time decay successfully applied to capability reputation indexes.',
    }, { severity: 'info' });
  }

  /**
   * Records execution outcome to update capability reputation.
   */
  public recordExecution(
    capabilityId: string,
    success: boolean,
    latencyMs: number,
    accuracyScore: number = 100,
    unexpectedBehavior: boolean = false
  ): void {
    const rep = this.getReputation(capabilityId);

    rep.lastUsedAt = new Date().toISOString();
    if (success) {
      rep.successCount += 1;
    } else {
      rep.failureCount += 1;
    }

    if (unexpectedBehavior) {
      rep.unexpectedBehaviorsCount += 1;
    }

    // Rolling latency average
    rep.avgLatencyMs = Math.round((rep.avgLatencyMs * 0.8) + (latencyMs * 0.2));

    // Rolling accuracy score
    rep.accuracyScore = Math.round((rep.accuracyScore * 0.8) + (accuracyScore * 0.2));

    this.recomputeMetrics(rep);

    messageBus.publish('CAPABILITY_REPUTATION_UPDATED', 'ReputationEngine', {
      capabilityId,
      success,
      latencyMs,
      reliabilityScore: rep.reliabilityScore,
    }, { severity: 'info' });
  }

  private recomputeMetrics(rep: CapabilityReputation): void {
    const total = rep.successCount + rep.failureCount;
    if (total > 0) {
      rep.successRate = rep.successCount / total;
    } else {
      rep.successRate = 1.0;
    }

    // Consistency score relates to latency jitter vs standard latency, modeled simply here
    const latencyJitterPenalty = Math.max(0, rep.avgLatencyMs > 500 ? 15 : 5);
    rep.consistencyScore = Math.max(50, 100 - latencyJitterPenalty);

    // Reliability score synthesizes success rate, consistency, and unexpected behaviors
    const successWeight = rep.successRate * 70; // Max 70 pts
    const consistencyWeight = (rep.consistencyScore / 100) * 15; // Max 15 pts
    const unexpectedPenalty = Math.min(15, rep.unexpectedBehaviorsCount * 5); // Deduct up to 15 pts
    const finalReliability = Math.round(successWeight + consistencyWeight + (15 - unexpectedPenalty));

    rep.reliabilityScore = Math.max(20, Math.min(100, finalReliability));
  }

  public getAllReputations(): CapabilityReputation[] {
    return Array.from(this.reputationCache.values());
  }
}

export const capabilityReputationEngine = new CapabilityReputationEngine();
export const capabilityReputation = capabilityReputationEngine;
