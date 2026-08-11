import { CollectiveObservation, SynthesizedAwareness } from '../../shared/types';

export class HiveConsciousnessEngine {
  private observations: Map<string, CollectiveObservation> = new Map();
  private synthesizedStates: Map<string, SynthesizedAwareness> = new Map();

  constructor() {
    this.seedInitialObservations();
  }

  private seedInitialObservations(): void {
    const obs1: CollectiveObservation = {
      id: 'obs-001',
      agentId: 'agent-perf-analyst',
      agentName: 'Performance Analyst',
      hiveId: 'hive-hermes-prime',
      observation: 'Cross-Hive RPC latency elevated during concurrent vector indexing.',
      category: 'PERFORMANCE',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      confidence: 0.94,
    };

    const obs2: CollectiveObservation = {
      id: 'obs-002',
      agentId: 'agent-db-sentinel',
      agentName: 'Database Sentinel',
      hiveId: 'hive-operations-beta',
      observation: 'Connection pool saturation reached 88% capacity during peak strategy debate.',
      category: 'INFRASTRUCTURE',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      confidence: 0.98,
    };

    const obs3: CollectiveObservation = {
      id: 'obs-003',
      agentId: 'agent-sec-auditor',
      agentName: 'Security Auditor Gamma',
      hiveId: 'hive-security-gamma',
      observation: 'All PQC lattice signatures verified cleanly with zero policy rejections.',
      category: 'SECURITY',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      confidence: 0.99,
    };

    this.observations.set(obs1.id, obs1);
    this.observations.set(obs2.id, obs2);
    this.observations.set(obs3.id, obs3);

    this.synthesizeObservations();
  }

  public addObservation(
    agentId: string,
    agentName: string,
    hiveId: string,
    observation: string,
    category: CollectiveObservation['category'],
    confidence: number = 0.95
  ): CollectiveObservation {
    const id = `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CollectiveObservation = {
      id,
      agentId,
      agentName,
      hiveId,
      observation,
      category,
      timestamp: new Date().toISOString(),
      confidence,
    };
    this.observations.set(id, record);
    this.synthesizeObservations();
    return record;
  }

  public getObservations(): CollectiveObservation[] {
    return Array.from(this.observations.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getSynthesizedAwareness(): SynthesizedAwareness[] {
    return Array.from(this.synthesizedStates.values());
  }

  public synthesizeObservations(): SynthesizedAwareness {
    const obsList = this.getObservations();
    const perfObs = obsList.filter(o => o.category === 'PERFORMANCE' || o.category === 'INFRASTRUCTURE');

    const synthId = `synth-${Date.now()}`;
    const contradictions: string[] = [];

    // Check for contradictory observations
    const perfConfidence = perfObs.reduce((acc, o) => acc + o.confidence, 0) / (perfObs.length || 1);
    if (perfObs.some(o => o.observation.includes('latency elevated')) && perfObs.some(o => o.observation.includes('nominal'))) {
      contradictions.push('Latency reports conflict between Sentinel and Profiler agents.');
    }

    const synth: SynthesizedAwareness = {
      id: synthId,
      title: 'Synthesized Collective Situational Awareness',
      summary: `System operating with ${obsList.length} active agent sensor inputs. Primary load concentrated in vector search & cross-Hive RPC transport.`,
      contributingObservationIds: obsList.map(o => o.id),
      contradictionsDetected: contradictions,
      primaryHypothesis: 'Cross-Hive RPC throughput bound by token quota schedule, resolvable via Stage 5B dynamic token allocation.',
      confidenceScore: Math.min(0.98, Number(perfConfidence.toFixed(2))),
      synthesizedAt: new Date().toISOString(),
    };

    this.synthesizedStates.set(synthId, synth);
    return synth;
  }
}

export const hiveConsciousnessEngine = new HiveConsciousnessEngine();
