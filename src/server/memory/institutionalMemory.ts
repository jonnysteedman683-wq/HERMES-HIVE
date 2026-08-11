import { InstitutionalDecision } from '../../shared/types';

export class InstitutionalMemory {
  private decisions: Map<string, InstitutionalDecision> = new Map();

  constructor() {
    this.seedDecisions();
  }

  private seedDecisions(): void {
    const d1: InstitutionalDecision = {
      decisionId: 'dec-inst-001',
      objective: 'Transition to Stage 4 Federated Autonomous Digital Organisation',
      context: 'Requirement to scale intelligence across specialized swarm clusters with formal contracts',
      alternativesConsidered: ['Monolithic single-swarm expansion', 'Unregulated agent mesh network'],
      selectedStrategy: 'Governed Federated Hive OS with Zero-Trust Signatures & Resource Economy',
      evidence: 'Simulation showed 3x higher throughput with zero governance safety violations.',
      riskLevel: 'LOW',
      expectedOutcome: 'Successful operation of 4 specialized Hives with contract negotiation',
      actualOutcome: 'Achieved 99.4% health score and 100% contract fulfillment across all 4 Hives.',
      confidenceScore: 0.98,
      decisionMaker: 'Hermes Executive Prime',
      timestamp: new Date().toISOString(),
    };

    const d2: InstitutionalDecision = {
      decisionId: 'dec-inst-002',
      objective: 'Implement Stage 5A Autonomous Self-Model & Digital Twin',
      context: 'Hermes must understand its own architecture, capabilities, and future scenarios before self-evolution',
      alternativesConsidered: ['Static hardcoded self-inspection', 'Unbounded live production testing'],
      selectedStrategy: 'Isolated Digital Twin Simulation + Dynamic Self-Model Graph',
      evidence: 'Digital Twin guarantees 100% production isolation while enabling accurate scenario forecasting.',
      riskLevel: 'LOW',
      expectedOutcome: 'High-confidence scenario predictions with zero production side-effects',
      actualOutcome: 'Self-Model and Digital Twin active with 0.98 confidence score.',
      confidenceScore: 0.97,
      decisionMaker: 'Hermes Executive Prime',
      timestamp: new Date().toISOString(),
    };

    this.decisions.set(d1.decisionId, d1);
    this.decisions.set(d2.decisionId, d2);
  }

  public getAllDecisions(): InstitutionalDecision[] {
    return Array.from(this.decisions.values());
  }

  public recordDecision(decision: Omit<InstitutionalDecision, 'decisionId' | 'timestamp'>): InstitutionalDecision {
    const id = `dec-inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullDec: InstitutionalDecision = {
      ...decision,
      decisionId: id,
      timestamp: new Date().toISOString(),
    };
    this.decisions.set(id, fullDec);
    return fullDec;
  }
}

export const institutionalMemory = new InstitutionalMemory();
