import { hiveRepository, federationEventRepository } from './federationRepositories';

export interface FederatedReputationRecord {
  hiveId: string;
  localReputation: number;
  federatedReputation: number;
  unverifiedClaimsCount: number;
  verifiedEvidenceCount: number;
  peerFeedbackScore: number;
  compositeScore: number;
  provenanceTrail: string[];
  lastUpdated: string;
}

export class FederatedReputationEngine {
  private records = new Map<string, FederatedReputationRecord>();

  constructor() {
    this.seedInitialReputations();
  }

  private seedInitialReputations() {
    const hives = hiveRepository.getAllHives();
    for (const h of hives) {
      this.records.set(h.identity.hiveId, {
        hiveId: h.identity.hiveId,
        localReputation: h.reputationScore,
        federatedReputation: h.reputationScore,
        unverifiedClaimsCount: 0,
        verifiedEvidenceCount: 5,
        peerFeedbackScore: 92,
        compositeScore: h.reputationScore,
        provenanceTrail: [`Initial certification for ${h.identity.name}`],
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  /**
   * Records a peer feedback or performance evidence event
   */
  public recordEvidence(
    reportingHiveId: string,
    targetHiveId: string,
    evidenceType: 'TASK_SUCCESS' | 'TASK_FAILURE' | 'POLICY_VIOLATION' | 'LATENCY_SPIKE',
    delta: number,
    evidenceText: string
  ): FederatedReputationRecord {
    // Prevent self-reported reputation updates
    if (reportingHiveId === targetHiveId) {
      throw new Error('Self-reporting reputation updates are forbidden by federation governance');
    }

    let rec = this.records.get(targetHiveId);
    if (!rec) {
      rec = {
        hiveId: targetHiveId,
        localReputation: 80,
        federatedReputation: 80,
        unverifiedClaimsCount: 0,
        verifiedEvidenceCount: 0,
        peerFeedbackScore: 80,
        compositeScore: 80,
        provenanceTrail: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    rec.verifiedEvidenceCount += 1;
    rec.federatedReputation = Math.min(100, Math.max(0, rec.federatedReputation + delta));
    rec.compositeScore = Math.round(rec.localReputation * 0.4 + rec.federatedReputation * 0.6);
    rec.provenanceTrail.push(
      `${new Date().toISOString()} — [Reported by ${reportingHiveId}] [${evidenceType}]: ${evidenceText} (delta: ${delta})`
    );
    rec.lastUpdated = new Date().toISOString();

    this.records.set(targetHiveId, rec);

    // Update Hive record
    const hive = hiveRepository.getHive(targetHiveId);
    if (hive) {
      hive.reputationScore = rec.compositeScore;
      hiveRepository.upsertHive(hive);
    }

    federationEventRepository.logEvent({
      eventId: `evt-rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: reportingHiveId,
      destinationHiveId: targetHiveId,
      eventType: 'FEDERATED_REPUTATION_UPDATED',
      details: { targetHiveId, evidenceType, delta, newScore: rec.compositeScore },
      governanceResult: 'ALLOWED',
      traceId: `trace-rep-${targetHiveId}`,
    });

    return rec;
  }

  public getReputationRecord(hiveId: string): FederatedReputationRecord | undefined {
    return this.records.get(hiveId);
  }

  public getAllReputationRecords(): FederatedReputationRecord[] {
    return Array.from(this.records.values());
  }
}

export const federatedReputationEngine = new FederatedReputationEngine();
