export interface EvolutionMemoryItem {
  id: string;
  type: 'SUCCESSFUL_IMPROVEMENT' | 'FAILED_EXPERIMENT' | 'REJECTED_HYPOTHESIS' | 'ARCHITECTURAL_EVOLUTION';
  title: string;
  summary: string;
  evidence: string;
  recordedAt: string;
}

export class EvolutionMemory {
  private items: Map<string, EvolutionMemoryItem> = new Map();

  constructor() {
    this.seedMemory();
  }

  private seedMemory(): void {
    const i1: EvolutionMemoryItem = {
      id: 'evmem-001',
      type: 'SUCCESSFUL_IMPROVEMENT',
      title: 'Promoted Research Hive Priority Token Quota',
      summary: 'Dynamic token boost yielded 31% latency reduction and increased discovery throughput.',
      evidence: 'Experiment exp-001 verified across 60-minute simulation trial.',
      recordedAt: new Date(Date.now() - 7200000).toISOString(),
    };

    const i2: EvolutionMemoryItem = {
      id: 'evmem-002',
      type: 'REJECTED_HYPOTHESIS',
      title: 'Hypothesis: Unbounded Parallel Cross-Hive Debates',
      summary: 'Rejected due to exponential token cost increase (+210%) without corresponding quality gains.',
      evidence: 'Simulation sim-scen-009 demonstrated diminishing returns beyond 3 parallel debate turns.',
      recordedAt: new Date(Date.now() - 14400000).toISOString(),
    };

    this.items.set(i1.id, i1);
    this.items.set(i2.id, i2);
  }

  public getAllItems(): EvolutionMemoryItem[] {
    return Array.from(this.items.values());
  }
}

export const evolutionMemory = new EvolutionMemory();
