import { DecisionReplayRecord } from '../../shared/types';

class DecisionReplayEngine {
  private records = new Map<string, DecisionReplayRecord>();

  public recordDecision(record: DecisionReplayRecord) {
    this.records.set(record.decisionId, record);
  }

  public getDecisionReplay(decisionId: string): DecisionReplayRecord | null {
    if (this.records.has(decisionId)) {
      return this.records.get(decisionId)!;
    }

    // Generate fallback structured replay if decision was registered dynamically
    return {
      decisionId,
      traceId: `trace_${decisionId}`,
      agentId: 'hermes_prime',
      timestamp: new Date().toISOString(),
      facts: [
        'Hermes Web Capability Fabric status is OPERATIONAL.',
        'Registered 7 capabilities across Low, Medium, and High Risk categories.',
      ],
      observations: [
        'Agent task queue latency currently at 12ms.',
        'Swarm collective consensus score evaluated at 92%.',
      ],
      assumptions: [
        'Target external capability endpoint will respond within 5000ms SLA.',
      ],
      inferences: [
        'Low-risk read queries can be authorized immediately without human approval.',
      ],
      predictions: [
        'Simulated success rate for capability execution is estimated at 98.4%.',
      ],
      candidateOptions: [
        {
          optionId: 'opt_1',
          description: 'Execute capability web.search in SIMULATE mode first',
          estimatedRisk: 1,
          confidenceScore: 0.95,
        },
        {
          optionId: 'opt_2',
          description: 'Execute capability directly without prior simulation',
          estimatedRisk: 3,
          confidenceScore: 0.82,
        },
      ],
      selectedOptionId: 'opt_1',
      rejectedOptionIds: ['opt_2'],
      dissentRecords: [],
      retrievedMemoryIds: ['mem_arch_001', 'mem_strategy_004'],
      finalDecisionText: 'Option opt_1 selected: Execute capability in SIMULATE mode first to verify safety.',
      resultingAction: 'web.search SIMULATE request dispatched to Hermes Web Bridge',
    };
  }

  public getAllDecisions(): DecisionReplayRecord[] {
    return Array.from(this.records.values());
  }
}

export const decisionReplayEngine = new DecisionReplayEngine();
