import { AgentReputationRecord } from '../../shared/types';

export class AgentReputationEngine {
  private records: Map<string, AgentReputationRecord> = new Map();

  constructor() {
    this.seedReputations();
  }

  private seedReputations(): void {
    const defaultAgents = [
      {
        agentId: 'agent-executive-prime',
        agentName: 'Hermes Executive Prime',
        role: 'Chief Cognitive Coordinator',
        accuracy: 98,
        reliability: 99,
        efficiency: 96,
        taskSuccess: 98,
        predictionAccuracy: 95,
        collaboration: 97,
        policyCompliance: 100,
        recoveryPerformance: 98,
      },
      {
        agentId: 'agent-perf-analyst',
        agentName: 'Performance Profiler Alpha',
        role: 'Telemetry & Benchmarking Specialist',
        accuracy: 96,
        reliability: 97,
        efficiency: 95,
        taskSuccess: 96,
        predictionAccuracy: 92,
        collaboration: 94,
        policyCompliance: 100,
        recoveryPerformance: 94,
      },
      {
        agentId: 'agent-db-sentinel',
        agentName: 'Database Sentinel Beta',
        role: 'Persistence & Query Optimization',
        accuracy: 97,
        reliability: 98,
        efficiency: 94,
        taskSuccess: 97,
        predictionAccuracy: 93,
        collaboration: 95,
        policyCompliance: 100,
        recoveryPerformance: 96,
      },
      {
        agentId: 'agent-sec-auditor',
        agentName: 'Security Auditor Gamma',
        role: 'Cryptographic & Policy Compliance',
        accuracy: 99,
        reliability: 99,
        efficiency: 93,
        taskSuccess: 99,
        predictionAccuracy: 96,
        collaboration: 96,
        policyCompliance: 100,
        recoveryPerformance: 99,
      },
    ];

    for (const a of defaultAgents) {
      const composite = Math.round(
        (a.accuracy * 0.15 +
          a.reliability * 0.15 +
          a.efficiency * 0.1 +
          a.taskSuccess * 0.2 +
          a.predictionAccuracy * 0.1 +
          a.collaboration * 0.1 +
          a.policyCompliance * 0.1 +
          a.recoveryPerformance * 0.1)
      );

      const rec: AgentReputationRecord = {
        agentId: a.agentId,
        agentName: a.agentName,
        role: a.role,
        accuracyScore: a.accuracy,
        reliabilityScore: a.reliability,
        efficiencyScore: a.efficiency,
        taskSuccessRatePct: a.taskSuccess,
        predictionAccuracyPct: a.predictionAccuracy,
        collaborationScore: a.collaboration,
        policyCompliancePct: a.policyCompliance,
        recoveryPerformanceScore: a.recoveryPerformance,
        compositeReputation: composite,
        evidenceLogs: [
          {
            timestamp: new Date().toISOString(),
            event: 'Baseline performance benchmark verification across Stage 5A/5B operations.',
            delta: 0,
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      this.records.set(a.agentId, rec);
    }
  }

  public getReputationRecords(): AgentReputationRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.compositeReputation - a.compositeReputation);
  }

  public recordPerformanceEvent(
    agentId: string,
    eventDescription: string,
    performanceDelta: number
  ): AgentReputationRecord | null {
    const rec = this.records.get(agentId);
    if (!rec) return null;

    rec.accuracyScore = Math.max(0, Math.min(100, rec.accuracyScore + performanceDelta));
    rec.taskSuccessRatePct = Math.max(0, Math.min(100, rec.taskSuccessRatePct + performanceDelta));

    rec.compositeReputation = Math.round(
      (rec.accuracyScore * 0.15 +
        rec.reliabilityScore * 0.15 +
        rec.efficiencyScore * 0.1 +
        rec.taskSuccessRatePct * 0.2 +
        rec.predictionAccuracyPct * 0.1 +
        rec.collaborationScore * 0.1 +
        rec.policyCompliancePct * 0.1 +
        rec.recoveryPerformanceScore * 0.1)
    );

    rec.evidenceLogs.unshift({
      timestamp: new Date().toISOString(),
      event: eventDescription,
      delta: performanceDelta,
    });

    rec.updatedAt = new Date().toISOString();
    return rec;
  }
}

export const agentReputationEngine = new AgentReputationEngine();
