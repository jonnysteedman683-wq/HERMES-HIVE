import { TrustRecord, TrustLevel } from '../../shared/types';
import { hiveRegistry } from './hiveRegistry';
import { hiveQuarantineEngine } from './hiveQuarantineEngine';

export class TrustEngine {
  private trustRecords: Map<string, TrustRecord> = new Map();

  constructor() {
    const now = new Date().toISOString();

    this.trustRecords.set('hive-hermes-prime', {
      hiveId: 'hive-hermes-prime',
      trustLevel: 'HIGH_TRUST',
      trustScore: 98,
      historicalSuccessCount: 42,
      historicalFailureCount: 0,
      lastVerifiedAt: now,
    });

    this.trustRecords.set('hive-research-alpha', {
      hiveId: 'hive-research-alpha',
      trustLevel: 'TRUSTED',
      trustScore: 92,
      historicalSuccessCount: 28,
      historicalFailureCount: 1,
      lastVerifiedAt: now,
    });

    this.trustRecords.set('hive-engineering-beta', {
      hiveId: 'hive-engineering-beta',
      trustLevel: 'TRUSTED',
      trustScore: 95,
      historicalSuccessCount: 35,
      historicalFailureCount: 1,
      lastVerifiedAt: now,
    });

    this.trustRecords.set('hive-security-gamma', {
      hiveId: 'hive-security-gamma',
      trustLevel: 'HIGH_TRUST',
      trustScore: 99,
      historicalSuccessCount: 50,
      historicalFailureCount: 0,
      lastVerifiedAt: now,
    });
  }

  public getTrustRecord(hiveId: string): TrustRecord | undefined {
    return this.trustRecords.get(hiveId);
  }

  public getAllTrustRecords(): TrustRecord[] {
    return Array.from(this.trustRecords.values());
  }

  public recordOutcome(hiveId: string, success: boolean): TrustRecord {
    let rec = this.trustRecords.get(hiveId);
    if (!rec) {
      rec = {
        hiveId,
        trustLevel: 'LIMITED',
        trustScore: 50,
        historicalSuccessCount: 0,
        historicalFailureCount: 0,
        lastVerifiedAt: new Date().toISOString(),
      };
      this.trustRecords.set(hiveId, rec);
    }

    if (success) {
      rec.historicalSuccessCount += 1;
      rec.trustScore = Math.min(100, rec.trustScore + 2);
    } else {
      rec.historicalFailureCount += 1;
      rec.trustScore = Math.max(0, rec.trustScore - 15);
    }

    // Re-evaluate trust level
    if (rec.trustScore < 30) {
      rec.trustLevel = 'QUARANTINED';
      hiveQuarantineEngine.quarantineHive(hiveId, 'QUARANTINED', 'Trust score dropped below threshold', 'Low trust score');
    } else if (rec.trustScore >= 90) {
      rec.trustLevel = 'HIGH_TRUST';
    } else if (rec.trustScore >= 70) {
      rec.trustLevel = 'TRUSTED';
    } else {
      rec.trustLevel = 'LIMITED';
    }

    rec.lastVerifiedAt = new Date().toISOString();
    return rec;
  }
}

export const trustEngine = new TrustEngine();
