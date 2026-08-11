import { MissionContract } from '../../shared/types';
import { hiveDiscovery } from './hiveDiscovery';
import { missionContractManager } from './missionContract';
import { federationProtocol } from './federationProtocol';

export interface ProposalTerms {
  executingHiveId: string;
  executingHiveName: string;
  estimatedCostTokens: number;
  estimatedTimeSec: number;
  confidenceScore: number;
  slaTerms: string;
}

export class NegotiationEngine {
  public requestProposals(requestingHiveId: string, requiredCapability: string, objective: string): ProposalTerms[] {
    const candidateHives = hiveDiscovery.findHivesByCapability(requiredCapability);
    const proposals: ProposalTerms[] = [];

    for (const hive of candidateHives) {
      if (hive.identity.hiveId === requestingHiveId) continue;

      const rep = hive.reputationScore || 80;
      const estimatedCostTokens = Math.round(15000 + (100 - rep) * 200);
      const estimatedTimeSec = Math.round(120 + Math.random() * 60);

      proposals.push({
        executingHiveId: hive.identity.hiveId,
        executingHiveName: hive.identity.name,
        estimatedCostTokens,
        estimatedTimeSec,
        confidenceScore: Number((rep / 100).toFixed(2)),
        slaTerms: '99.5% completion SLA with independent verification audit',
      });

      // Send proposal protocol message
      federationProtocol.createMessage(hive.identity.hiveId, 'MISSION_PROPOSAL', {
        objective,
        estimatedCostTokens,
        estimatedTimeSec,
      });
    }

    return proposals;
  }

  public finalizeNegotiation(
    requestingHiveId: string,
    selectedProposal: ProposalTerms,
    objective: string,
    successCriteria: string[]
  ): MissionContract {
    const contract = missionContractManager.createContract({
      requestingHive: requestingHiveId,
      executingHive: selectedProposal.executingHiveId,
      objective,
      successCriteria,
      maxTokens: selectedProposal.estimatedCostTokens,
      riskLevel: 'LOW',
    });

    missionContractManager.updateStatus(contract.contractId, 'ACCEPTED');

    federationProtocol.createMessage(selectedProposal.executingHiveId, 'MISSION_ACCEPTED', {
      contractId: contract.contractId,
      terms: selectedProposal,
    });

    return contract;
  }
}

export const negotiationEngine = new NegotiationEngine();
