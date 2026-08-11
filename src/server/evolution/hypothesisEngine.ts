import { EvolutionHypothesis } from '../../shared/types';

export class HypothesisEngine {
  private hypotheses: Map<string, EvolutionHypothesis> = new Map();

  constructor() {
    this.seedHypotheses();
  }

  private seedHypotheses(): void {
    const h1: EvolutionHypothesis = {
      hypothesisId: 'hyp-001',
      statement: 'Dynamic token budget rebalancing from Operations to Research Hive will increase strategic discovery rate by 30%.',
      evidence: 'Stage 5A Digital Twin simulation sim-scen-002 demonstrated 22% performance increase with zero contract drops.',
      expectedEffect: 'Accelerate cross-Hive research mission throughput.',
      measurementMetric: 'New Strategic Opportunities Discovered per Hour',
      riskLevel: 'LOW',
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
    };

    const h2: EvolutionHypothesis = {
      hypothesisId: 'hyp-002',
      statement: 'Adding automated verification agent to Engineering Hive contract pipeline will reduce build error rate by 45%.',
      evidence: 'Historical mission telemetry indicates 12% of build failures were due to missing dependency checks.',
      expectedEffect: 'Higher software build first-time compilation pass rate.',
      measurementMetric: 'Compilation First-Pass Success Rate (%)',
      riskLevel: 'MEDIUM',
      confidenceScore: 0.94,
      createdAt: new Date().toISOString(),
    };

    this.hypotheses.set(h1.hypothesisId, h1);
    this.hypotheses.set(h2.hypothesisId, h2);
  }

  public getAllHypotheses(): EvolutionHypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  public createHypothesis(
    statement: string,
    evidence: string,
    expectedEffect: string,
    measurementMetric: string
  ): EvolutionHypothesis {
    const id = `hyp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const h: EvolutionHypothesis = {
      hypothesisId: id,
      statement,
      evidence,
      expectedEffect,
      measurementMetric,
      riskLevel: 'LOW',
      confidenceScore: 0.95,
      createdAt: new Date().toISOString(),
    };
    this.hypotheses.set(id, h);
    return h;
  }
}

export const hypothesisEngine = new HypothesisEngine();
