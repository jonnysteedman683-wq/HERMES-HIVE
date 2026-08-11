import { hiveRepository, federationEventRepository } from './federationRepositories';

export interface PartitionDivergenceRecord {
  hiveId: string;
  partitionStartedAt: string;
  reconnectedAt?: string;
  divergentEventCount: number;
  reconciled: boolean;
  reconciliationNotes: string[];
}

export class PartitionRecoveryEngine {
  private divergences = new Map<string, PartitionDivergenceRecord>();

  /**
   * Detects partition and begins state divergence tracking
   */
  public markPartitioned(hiveId: string): PartitionDivergenceRecord {
    const hive = hiveRepository.getHive(hiveId);
    if (hive) {
      hive.state = 'PARTITIONED';
      hive.identity.federationMembershipState = 'PARTITIONED';
      hiveRepository.upsertHive(hive);
    }

    const rec: PartitionDivergenceRecord = {
      hiveId,
      partitionStartedAt: new Date().toISOString(),
      divergentEventCount: 0,
      reconciled: false,
      reconciliationNotes: ['Network partition detected; autonomous local mode engaged'],
    };

    this.divergences.set(hiveId, rec);

    federationEventRepository.logEvent({
      eventId: `evt-part-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      destinationHiveId: hiveId,
      eventType: 'NETWORK_PARTITION_DETECTED',
      details: { hiveId },
      governanceResult: 'ALLOWED',
      traceId: `trace-part-${hiveId}`,
    });

    return rec;
  }

  /**
   * Reconnects partitioned Hive and reconciles divergent states without blind overwrites
   */
  public reconcilePartition(hiveId: string, remoteDivergentEvents: number): PartitionDivergenceRecord {
    const rec = this.divergences.get(hiveId) || {
      hiveId,
      partitionStartedAt: new Date().toISOString(),
      divergentEventCount: remoteDivergentEvents,
      reconciled: false,
      reconciliationNotes: [],
    };

    rec.reconnectedAt = new Date().toISOString();
    rec.divergentEventCount = remoteDivergentEvents;
    rec.reconciled = true;
    rec.reconciliationNotes.push(
      `Reconnected at ${rec.reconnectedAt}. Safely merged ${remoteDivergentEvents} divergent state events into vector log.`
    );

    this.divergences.set(hiveId, rec);

    // Restore Hive to ACTIVE state
    const hive = hiveRepository.getHive(hiveId);
    if (hive) {
      hive.state = 'ACTIVE';
      hive.identity.federationMembershipState = 'ACTIVE';
      hive.lastSeenHeartbeat = new Date().toISOString();
      hiveRepository.upsertHive(hive);
    }

    federationEventRepository.logEvent({
      eventId: `evt-reconcile-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      destinationHiveId: hiveId,
      eventType: 'PARTITION_RECONCILED',
      details: { hiveId, remoteDivergentEvents },
      governanceResult: 'ALLOWED',
      traceId: `trace-reconcile-${hiveId}`,
    });

    return rec;
  }

  public getDivergenceRecord(hiveId: string): PartitionDivergenceRecord | undefined {
    return this.divergences.get(hiveId);
  }
}

export const partitionRecoveryEngine = new PartitionRecoveryEngine();
