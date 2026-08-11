import { CollectiveDecisionProposal } from '../../shared/types';
import { governanceEngine } from '../governance/governanceEngine';

export class CollectiveDecisionEngine {
  private proposals: Map<string, CollectiveDecisionProposal> = new Map();

  constructor() {
    this.seedProposals();
  }

  private seedProposals(): void {
    const p1: CollectiveDecisionProposal = {
      proposalId: 'dec-001',
      title: 'Reallocate 20% Token Budget to Research Alpha Hive',
      objective: 'Accelerate cross-Hive strategic discovery rate during peak operational window.',
      proposerAgentId: 'agent-executive-prime',
      options: [
        {
          optionId: 'opt-a',
          description: 'Reallocate +20% tokens dynamically to Research Hive with automatic rollback trigger.',
          expectedOutcome: '30% increase in strategic hypothesis throughput.',
          riskLevel: 'LOW',
        },
        {
          optionId: 'opt-b',
          description: 'Maintain static 25% equal allocation across all 4 Hives.',
          expectedOutcome: 'Stable baseline performance without reallocation.',
          riskLevel: 'LOW',
        },
      ],
      votes: [
        {
          agentId: 'agent-executive-prime',
          agentRole: 'Executive Coordinator',
          selectedOptionId: 'opt-a',
          weight: 1.5,
          reasoning: 'Digital Twin simulation sim-scen-002 demonstrated +22% throughput boost.',
          confidence: 0.96,
        },
        {
          agentId: 'agent-perf-analyst',
          agentRole: 'Performance Analyst',
          selectedOptionId: 'opt-a',
          weight: 1.2,
          reasoning: 'Research Hive queue length is currently 3.2x higher than Operations queue.',
          confidence: 0.94,
        },
        {
          agentId: 'agent-risk-auditor',
          agentRole: 'Governance Auditor',
          selectedOptionId: 'opt-b',
          weight: 1.1,
          reasoning: 'Minor risk of temporary latency spike in Operations Hive during unexpected surge.',
          confidence: 0.88,
        },
      ],
      dissentRecords: [
        {
          agentId: 'agent-risk-auditor',
          dissentingOptionId: 'opt-b',
          rationale: 'Operations Hive buffer capacity drops below 15% safety threshold during peak bursts.',
          evidence: 'Historical telemetry telemetry-burst-081',
          riskWarning: 'Monitor Operations Hive connection pool closely if Option A is adopted.',
        },
      ],
      quorumMet: true,
      consensusOptionId: 'opt-a',
      consensusConfidence: 0.93,
      status: 'CONSENSUS_REACHED',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    };

    this.proposals.set(p1.proposalId, p1);
  }

  public getAllProposals(): CollectiveDecisionProposal[] {
    return Array.from(this.proposals.values());
  }

  public createProposal(
    title: string,
    objective: string,
    proposerAgentId: string,
    options: CollectiveDecisionProposal['options']
  ): CollectiveDecisionProposal {
    const id = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const prop: CollectiveDecisionProposal = {
      proposalId: id,
      title,
      objective,
      proposerAgentId,
      options,
      votes: [],
      dissentRecords: [],
      quorumMet: false,
      consensusConfidence: 0,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(id, prop);
    return prop;
  }

  public castVote(
    proposalId: string,
    agentId: string,
    agentRole: string,
    selectedOptionId: string,
    weight: number,
    reasoning: string,
    confidence: number = 0.95,
    isDissent: boolean = false,
    dissentEvidence: string = ''
  ): CollectiveDecisionProposal | null {
    const prop = this.proposals.get(proposalId);
    if (!prop) return null;

    prop.votes.push({
      agentId,
      agentRole,
      selectedOptionId,
      weight,
      reasoning,
      confidence,
    });

    if (isDissent) {
      prop.dissentRecords.push({
        agentId,
        dissentingOptionId: selectedOptionId,
        rationale: reasoning,
        evidence: dissentEvidence || 'Agent domain empirical analysis',
        riskWarning: 'Preserved minority dissent for post-execution verification and learning.',
      });
    }

    // Evaluate quorum & consensus
    if (prop.votes.length >= 3) {
      prop.quorumMet = true;

      // Check constitutional governance policy first!
      const isProhibited = governanceEngine.checkAction('DANGEROUS_SYSTEM_OVERRIDE');
      if (isProhibited) {
        prop.status = 'GOVERNANCE_BLOCKED';
        return prop;
      }

      // Calculate weighted votes
      const scoreMap: Record<string, number> = {};
      for (const v of prop.votes) {
        scoreMap[v.selectedOptionId] = (scoreMap[v.selectedOptionId] || 0) + v.weight * v.confidence;
      }

      let bestOption = '';
      let maxScore = -1;
      for (const [optId, score] of Object.entries(scoreMap)) {
        if (score > maxScore) {
          maxScore = score;
          bestOption = optId;
        }
      }

      prop.consensusOptionId = bestOption;
      prop.consensusConfidence = Math.min(0.99, Number((maxScore / (prop.votes.length * 1.5)).toFixed(2)));
      prop.status = 'CONSENSUS_REACHED';
    } else {
      prop.status = 'DEBATING';
    }

    return prop;
  }
}

export const collectiveDecisionEngine = new CollectiveDecisionEngine();
