import { OpportunityProposal } from '../../shared/types';

export class OpportunityEngine {
  private proposals: Map<string, OpportunityProposal> = new Map();

  constructor() {
    this.seedProposals();
  }

  private seedProposals(): void {
    const now = new Date().toISOString();

    const prop1: OpportunityProposal = {
      proposalId: 'opp-001',
      title: 'Automated Post-Quantum Message Encryption',
      description: 'Implement lattice-based post-quantum cryptography on all cross-Hive federation sockets',
      evidence: 'Observed 12 federated cross-hive requests. Security Gamma Hive detected future-proofing gap.',
      expectedValue: 92,
      estimatedCostTokens: 25000,
      riskLevel: 'LOW',
      confidence: 0.94,
      recommendedAction: 'Deploy Kyber/Dilithium wrapper in federationProtocol.ts',
      status: 'PROPOSED',
      createdAt: now,
    };

    const prop2: OpportunityProposal = {
      proposalId: 'opp-002',
      title: 'Resource Token Economy Dynamic Balancing',
      description: 'Automatically adjust agent token budgets based on real-time task complexity',
      evidence: 'Task failure logs show 3 retries caused by premature token truncation during complex debates.',
      expectedValue: 88,
      estimatedCostTokens: 18000,
      riskLevel: 'LOW',
      confidence: 0.91,
      recommendedAction: 'Connect resourceManager.ts with goalManager.ts complexity heuristic',
      status: 'PROPOSED',
      createdAt: now,
    };

    this.proposals.set(prop1.proposalId, prop1);
    this.proposals.set(prop2.proposalId, prop2);
  }

  public getAllProposals(): OpportunityProposal[] {
    return Array.from(this.proposals.values());
  }

  public approveProposal(id: string): boolean {
    const p = this.proposals.get(id);
    if (!p) return false;
    p.status = 'APPROVED';
    return true;
  }

  public rejectProposal(id: string): boolean {
    const p = this.proposals.get(id);
    if (!p) return false;
    p.status = 'REJECTED';
    return true;
  }
}

export const opportunityEngine = new OpportunityEngine();
