import { HiveQuarantineRecord, QuarantineStatus } from '../../shared/types';
import { hiveRepository, federationEventRepository } from './federationRepositories';

export class HiveQuarantineEngine {
  private quarantines = new Map<string, HiveQuarantineRecord>();

  /**
   * Quarantines a Hive due to policy violations, Byzantine behavior, or signature anomalies
   */
  public quarantineHive(
    hiveId: string,
    status: QuarantineStatus,
    reason: string,
    evidence: string,
    quarantinedBy = 'hive-hermes-prime'
  ): HiveQuarantineRecord {
    const quarantineId = `quar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const record: HiveQuarantineRecord = {
      quarantineId,
      hiveId,
      status,
      reason,
      evidence,
      quarantinedBy,
      timestamp: new Date().toISOString(),
      recoveryConditions: [
        'Complete security audit pass',
        'Verification of PQC signature key pair',
        'Federation consensus approval (quorum >= 80%)',
      ],
    };

    this.quarantines.set(hiveId, record);

    // Update Hive record
    const hive = hiveRepository.getHive(hiveId);
    if (hive) {
      hive.quarantineStatus = status;
      if (status === 'QUARANTINED' || status === 'ISOLATED') {
        hive.state = 'QUARANTINED';
        hive.identity.federationMembershipState = 'QUARANTINED';
      }
      hiveRepository.upsertHive(hive);
    }

    federationEventRepository.logEvent({
      eventId: `evt-quar-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: quarantinedBy,
      destinationHiveId: hiveId,
      eventType: 'HIVE_QUARANTINED',
      details: { hiveId, status, reason, evidence },
      governanceResult: 'QUARANTINED',
      traceId: `trace-quar-${quarantineId}`,
    });

    return record;
  }

  /**
   * Recovers a quarantined Hive after explicit audit validation
   */
  public recoverHive(hiveId: string, auditorHiveId: string): boolean {
    const record = this.quarantines.get(hiveId);
    if (!record) return false;

    record.status = 'NONE';
    this.quarantines.delete(hiveId);

    const hive = hiveRepository.getHive(hiveId);
    if (hive) {
      hive.quarantineStatus = 'NONE';
      hive.state = 'ACTIVE';
      hive.identity.federationMembershipState = 'ACTIVE';
      hiveRepository.upsertHive(hive);
    }

    federationEventRepository.logEvent({
      eventId: `evt-quarrec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: auditorHiveId,
      destinationHiveId: hiveId,
      eventType: 'HIVE_QUARANTINE_RECOVERED',
      details: { hiveId },
      governanceResult: 'ALLOWED',
      traceId: `trace-quarrec-${hiveId}`,
    });

    return true;
  }

  public getQuarantineRecord(hiveId: string): HiveQuarantineRecord | undefined {
    return this.quarantines.get(hiveId);
  }

  public getAllQuarantines(): HiveQuarantineRecord[] {
    return Array.from(this.quarantines.values());
  }
}

export const hiveQuarantineEngine = new HiveQuarantineEngine();
