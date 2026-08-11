import { CollectiveMemoryRecord } from '../../shared/types';

export class CollectiveMemoryEngine {
  private memories: Map<string, CollectiveMemoryRecord> = new Map();

  constructor() {
    this.seedMemory();
  }

  private seedMemory(): void {
    const m1: CollectiveMemoryRecord = {
      id: 'mem-001',
      category: 'SUCCESSFUL_STRATEGY',
      content: 'Dynamic token allocation boost to Research Hive accelerates strategic discovery by 31% with zero security policy violations.',
      sourceAgentIds: ['agent-executive-prime', 'agent-perf-analyst'],
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      evidence: 'Experiment exp-001 in sandbox environment verified across 60-minute trial.',
      confidence: 0.98,
      validationStatus: 'PROMOTED',
      relevanceTags: ['TOKEN_SCHEDULING', 'RESEARCH_BOOST', 'LATENCY_OPTIMIZATION'],
      relatedGoalIds: ['goal-001', 'goal-002'],
    };

    const m2: CollectiveMemoryRecord = {
      id: 'mem-002',
      category: 'REJECTED_HYPOTHESIS',
      content: 'Unbounded parallel cross-Hive strategy debates lead to exponential token consumption without quality improvement.',
      sourceAgentIds: ['agent-sec-auditor', 'agent-risk-auditor'],
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      evidence: 'Digital Twin simulation sim-scen-009 demonstrated diminishing returns beyond 3 debate turns.',
      confidence: 0.95,
      validationStatus: 'VALIDATED',
      relevanceTags: ['DEBATE_BOUNDS', 'TOKEN_EFFICIENCY', 'GOVERNANCE'],
      relatedGoalIds: ['goal-003'],
    };

    this.memories.set(m1.id, m1);
    this.memories.set(m2.id, m2);
  }

  public getAllMemories(): CollectiveMemoryRecord[] {
    return Array.from(this.memories.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addMemoryRecord(
    category: CollectiveMemoryRecord['category'],
    content: string,
    sourceAgentIds: string[],
    evidence: string,
    confidence: number = 0.95,
    relevanceTags: string[] = [],
    relatedGoalIds: string[] = []
  ): CollectiveMemoryRecord {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CollectiveMemoryRecord = {
      id,
      category,
      content,
      sourceAgentIds,
      timestamp: new Date().toISOString(),
      evidence,
      confidence,
      validationStatus: 'VALIDATED',
      relevanceTags,
      relatedGoalIds,
    };

    this.memories.set(id, record);
    return record;
  }
}

export const collectiveMemoryEngine = new CollectiveMemoryEngine();
