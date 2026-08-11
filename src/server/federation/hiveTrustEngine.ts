import { FederatedTrustRecord, FederatedTrustLevel } from '../../shared/types';
import { trustRepository, hiveRepository, federationEventRepository } from './federationRepositories';

export class HiveTrustEngine {
  /**
   * Evaluates evidence and calculates dynamic trust score and trust level
   */
  public evaluateTrust(
    hiveId: string,
    evidenceItem: string,
    reliabilityDelta: number,
    policyComplianceDelta: number
  ): FederatedTrustRecord {
    let trustRecord = trustRepository.getTrustRecord(hiveId);
    if (!trustRecord) {
      trustRecord = {
        hiveId,
        trustLevel: 'PENDING',
        trustScore: 50,
        verifiedEvidence: [],
        historicalReliabilityPct: 80.0,
        policyCompliancePct: 90.0,
        lastEvaluatedAt: new Date().toISOString(),
      };
    }

    trustRecord.verifiedEvidence.push(`${new Date().toISOString()} — ${evidenceItem}`);
    if (trustRecord.verifiedEvidence.length > 20) {
      trustRecord.verifiedEvidence.shift();
    }

    trustRecord.historicalReliabilityPct = Math.min(100, Math.max(0, trustRecord.historicalReliabilityPct + reliabilityDelta));
    trustRecord.policyCompliancePct = Math.min(100, Math.max(0, trustRecord.policyCompliancePct + policyComplianceDelta));

    // Dynamic Trust Score Formula
    const newTrustScore = Math.round(
      trustRecord.historicalReliabilityPct * 0.5 + trustRecord.policyCompliancePct * 0.5
    );

    trustRecord.trustScore = newTrustScore;

    // Derive Trust Level
    if (newTrustScore >= 95) {
      trustRecord.trustLevel = 'HIGH_TRUST';
    } else if (newTrustScore >= 80) {
      trustRecord.trustLevel = 'TRUSTED';
    } else if (newTrustScore >= 60) {
      trustRecord.trustLevel = 'LIMITED';
    } else if (newTrustScore >= 40) {
      trustRecord.trustLevel = 'DEGRADED';
    } else if (newTrustScore >= 20) {
      trustRecord.trustLevel = 'UNTRUSTED';
    } else {
      trustRecord.trustLevel = 'QUARANTINED';
    }

    trustRecord.lastEvaluatedAt = new Date().toISOString();
    trustRepository.saveTrustRecord(trustRecord);

    // Sync back to Hive Repository
    const hive = hiveRepository.getHive(hiveId);
    if (hive) {
      hive.trustScore = newTrustScore;
      hive.identity.trustStatus = trustRecord.trustLevel;
      hiveRepository.upsertHive(hive);
    }

    federationEventRepository.logEvent({
      eventId: `evt-trust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      destinationHiveId: hiveId,
      eventType: 'TRUST_EVALUATED',
      details: { hiveId, newTrustScore, trustLevel: trustRecord.trustLevel, evidenceItem },
      governanceResult: 'ALLOWED',
      traceId: `trace-trust-${hiveId}`,
    });

    return trustRecord;
  }

  public getTrustRecord(hiveId: string): FederatedTrustRecord | undefined {
    return trustRepository.getTrustRecord(hiveId);
  }

  public getAllTrustRecords(): FederatedTrustRecord[] {
    return trustRepository.getAllTrustRecords();
  }
}

export const hiveTrustEngine = new HiveTrustEngine();
