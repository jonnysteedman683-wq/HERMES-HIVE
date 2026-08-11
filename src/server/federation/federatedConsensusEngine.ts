import { FederatedConsensusProposal } from '../../shared/types';
import { hiveRepository, federationEventRepository } from './federationRepositories';

export class FederatedConsensusEngine {
  private proposals = new Map<string, FederatedConsensusProposal>();

  /**
   * Creates a multi-Hive decision proposal
   */
  public createProposal(
    proposerHiveId: string,
    title: string,
    objective: string,
    options: { optionId: string; description: string; expectedOutcome: string }[],
    affectedHiveIds: string[]
  ): FederatedConsensusProposal {
    const proposalId = `fedprop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const proposal: FederatedConsensusProposal = {
      proposalId,
      proposerHiveId,
      title,
      objective,
      affectedHiveIds,
      options,
      votes: [],
      dissentRecords: [],
      quorumPct: 60,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(proposalId, proposal);

    federationEventRepository.logEvent({
      eventId: `evt-prop-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: proposerHiveId,
      eventType: 'FEDERATED_CONSENSUS_PROPOSAL_CREATED',
      details: { proposalId, title, affectedHiveIds },
      governanceResult: 'ALLOWED',
      traceId: `trace-prop-${proposalId}`,
    });

    return proposal;
  }

  /**
   * Casts a vote and preserves minority dissent if dissenting
   */
  public castVote(
    proposalId: string,
    voterHiveId: string,
    selectedOptionId: string,
    reasoning: string,
    isDissenting = false,
    dissentEvidence = ''
  ): FederatedConsensusProposal | undefined {
    const prop = this.proposals.get(proposalId);
    if (!prop) return undefined;

    const hive = hiveRepository.getHive(voterHiveId);
    const weight = hive ? hive.trustScore / 100 : 0.8;
    const signature = `sig-vote-${voterHiveId}-${selectedOptionId}`;

    prop.votes.push({
      hiveId: voterHiveId,
      selectedOptionId,
      weight,
      reasoning,
      signature,
    });

    if (isDissenting) {
      prop.dissentRecords.push({
        hiveId: voterHiveId,
        rationale: reasoning,
        evidence: dissentEvidence || 'Dissenting minority analysis recorded',
      });
    }

    // Check Quorum & Consensus
    const totalRequired = Math.max(1, prop.affectedHiveIds.length);
    const votingRatio = prop.votes.length / totalRequired;

    if (votingRatio >= prop.quorumPct / 100) {
      // Tally weighted votes
      const tallies = new Map<string, number>();
      for (const v of prop.votes) {
        const cur = tallies.get(v.selectedOptionId) || 0;
        tallies.set(v.selectedOptionId, cur + v.weight);
      }

      let winningOpt = '';
      let maxWeight = -1;
      for (const [optId, w] of tallies.entries()) {
        if (w > maxWeight) {
          maxWeight = w;
          winningOpt = optId;
        }
      }

      prop.consensusOptionId = winningOpt;
      prop.status = 'CONSENSUS_REACHED';
    } else {
      prop.status = 'VOTING';
    }

    this.proposals.set(proposalId, prop);

    federationEventRepository.logEvent({
      eventId: `evt-vote-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: voterHiveId,
      eventType: 'FEDERATED_VOTE_CAST',
      details: { proposalId, selectedOptionId, isDissenting },
      governanceResult: 'ALLOWED',
      traceId: `trace-vote-${proposalId}`,
    });

    return prop;
  }

  public getProposal(proposalId: string): FederatedConsensusProposal | undefined {
    return this.proposals.get(proposalId);
  }

  public getAllProposals(): FederatedConsensusProposal[] {
    return Array.from(this.proposals.values());
  }
}

export const federatedConsensusEngine = new FederatedConsensusEngine();
