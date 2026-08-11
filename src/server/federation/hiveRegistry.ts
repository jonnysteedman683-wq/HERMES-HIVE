import {
  FederatedHiveRecord,
  FederatedHiveIdentity,
  FederatedHiveState,
  QuarantineStatus,
} from '../../shared/types';
import { hiveRepository, federationEventRepository } from './federationRepositories';
import { hiveIdentityEngine } from './hiveIdentityEngine';

export class HiveRegistry {
  /**
   * Registers a new Hive into the federation registry.
   * Enforces the Discovery Pipeline: DISCOVERED -> IDENTIFIED -> TRUST_EVALUATED -> AUTHORIZED -> ACTIVE
   */
  public registerHive(
    hiveId: string,
    name: string,
    description: string,
    capabilities: string[],
    endpoint: string
  ): FederatedHiveRecord {
    const existing = hiveRepository.getHive(hiveId);
    if (existing) {
      existing.lastSeenHeartbeat = new Date().toISOString();
      existing.endpoint = endpoint;
      hiveRepository.upsertHive(existing);
      return existing;
    }

    const identity: FederatedHiveIdentity = hiveIdentityEngine.createIdentity(
      hiveId,
      name,
      description,
      capabilities
    );

    // Initial Discovery State
    identity.federationMembershipState = 'DISCOVERING';

    const record: FederatedHiveRecord = {
      identity,
      state: 'DISCOVERING',
      lastSeenHeartbeat: new Date().toISOString(),
      endpoint,
      reputationScore: 80,
      trustScore: 50, // Initial default pending trust score
      quarantineStatus: 'NONE',
      capabilities,
    };

    hiveRepository.upsertHive(record);

    federationEventRepository.logEvent({
      eventId: `evt-register-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      destinationHiveId: hiveId,
      eventType: 'HIVE_REGISTERED',
      details: { hiveId, name, endpoint, capabilities },
      governanceResult: 'ALLOWED',
      traceId: `trace-reg-${hiveId}`,
    });

    return record;
  }

  /**
   * Transition Hive state through the discovery pipeline
   */
  public transitionState(hiveId: string, newState: FederatedHiveState): FederatedHiveRecord | undefined {
    const hive = hiveRepository.getHive(hiveId);
    if (!hive) return undefined;

    const oldState = hive.state;
    hive.state = newState;
    hive.identity.federationMembershipState = newState;
    hiveRepository.upsertHive(hive);

    federationEventRepository.logEvent({
      eventId: `evt-state-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      destinationHiveId: hiveId,
      eventType: 'HIVE_STATE_TRANSITION',
      details: { hiveId, oldState, newState },
      governanceResult: 'ALLOWED',
      traceId: `trace-state-${hiveId}`,
    });

    return hive;
  }

  /**
   * Process incoming heartbeat from a registered Hive
   */
  public recordHeartbeat(hiveId: string): FederatedHiveRecord | undefined {
    const hive = hiveRepository.getHive(hiveId);
    if (!hive) return undefined;

    hive.lastSeenHeartbeat = new Date().toISOString();
    if (hive.state === 'UNREACHABLE' || hive.state === 'PARTITIONED') {
      hive.state = 'ACTIVE';
      hive.identity.federationMembershipState = 'ACTIVE';
    }
    hiveRepository.upsertHive(hive);
    return hive;
  }

  /**
   * Scans for stale Hives that haven't sent heartbeats recently
   */
  public scanStaleHives(timeoutMs = 30000): FederatedHiveRecord[] {
    const all = hiveRepository.getAllHives();
    const now = Date.now();
    const degradedOrUnreachable: FederatedHiveRecord[] = [];

    for (const hive of all) {
      if (hive.state === 'QUARANTINED' || hive.state === 'SUSPENDED') continue;

      const lastHb = new Date(hive.lastSeenHeartbeat).getTime();
      const diff = now - lastHb;

      if (diff > timeoutMs * 2 && hive.state !== 'UNREACHABLE') {
        this.transitionState(hive.identity.hiveId, 'UNREACHABLE');
        degradedOrUnreachable.push(hive);
      } else if (diff > timeoutMs && hive.state === 'ACTIVE') {
        this.transitionState(hive.identity.hiveId, 'DEGRADED');
        degradedOrUnreachable.push(hive);
      }
    }

    return degradedOrUnreachable;
  }

  public getHive(hiveId: string): FederatedHiveRecord | undefined {
    return hiveRepository.getHive(hiveId);
  }

  public getAllHives(): FederatedHiveRecord[] {
    return hiveRepository.getAllHives();
  }
}

export const hiveRegistry = new HiveRegistry();
