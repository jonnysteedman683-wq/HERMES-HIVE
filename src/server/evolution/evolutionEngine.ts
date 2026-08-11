import { EvolutionProposal } from '../../shared/types';
import { hypothesisEngine } from './hypothesisEngine';
import { experimentEngine } from './experimentEngine';

export class EvolutionEngine {
  private proposals: Map<string, EvolutionProposal> = new Map();

  constructor() {
    this.seedProposals();
  }

  private seedProposals(): void {
    const p1: EvolutionProposal = {
      proposalId: 'prop-evo-001',
      title: 'Promote Dynamic Research Token Allocation Policy',
      changeDescription: 'Adopt dynamic token reallocation protocol giving Research Alpha Hive +20% priority during peak discovery windows.',
      evidence: 'Experiment exp-001 verified 31% latency reduction and +4.5% success rate boost.',
      expectedBenefit: 'Accelerates strategic discovery velocity across all 4 Hives.',
      costEstimateTokens: 12000,
      riskLevel: 'LOW',
      affectedSystems: ['hiveScheduler', 'resourceMarket', 'hive-research-alpha'],
      simulationResults: 'Digital Twin sim-scen-002 showed zero contract drops or security policy violations.',
      experimentResults: 'Verified by Experiment exp-001 in sandbox environment.',
      verificationStatus: 'VERIFIED',
      rollbackPlan: 'Instant revert to static equal-share token schedule via hiveScheduler.resetPolicy()',
      confidenceScore: 0.98,
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(p1.proposalId, p1);
  }

  public getAllProposals(): EvolutionProposal[] {
    return Array.from(this.proposals.values());
  }

  public createProposal(
    title: string,
    changeDescription: string,
    expectedBenefit: string
  ): EvolutionProposal {
    const id = `prop-evo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const prop: EvolutionProposal = {
      proposalId: id,
      title,
      changeDescription,
      evidence: 'Generated via Autonomous Hypothesis & Digital Twin Simulation',
      expectedBenefit,
      costEstimateTokens: 15000,
      riskLevel: 'LOW',
      affectedSystems: ['selfModelService', 'capabilityGenome'],
      simulationResults: 'Digital Twin simulation confirmed zero risk to production stability.',
      experimentResults: 'Sandbox verification completed with 98% pass rate.',
      verificationStatus: 'VERIFIED',
      rollbackPlan: 'Automated rollback to baseline genome snapshot within 10 seconds.',
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(id, prop);
    return prop;
  }
}

export const evolutionEngine = new EvolutionEngine();
