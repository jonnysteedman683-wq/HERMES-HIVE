import {
  FederatedHiveRecord,
  FederatedMessage,
  FederatedTrustRecord,
  FederatedTask,
  FederatedMemoryRecord,
  FederationEvent,
} from '../../shared/types';

export interface IHiveRepository {
  getHive(hiveId: string): FederatedHiveRecord | undefined;
  getAllHives(): FederatedHiveRecord[];
  upsertHive(hive: FederatedHiveRecord): FederatedHiveRecord;
  removeHive(hiveId: string): boolean;
}

export interface IFederationMessageRepository {
  saveMessage(msg: FederatedMessage): FederatedMessage;
  getMessage(messageId: string): FederatedMessage | undefined;
  getMessagesForHive(hiveId: string): FederatedMessage[];
  hasProcessedMessage(messageId: string): boolean;
}

export interface ITrustRepository {
  getTrustRecord(hiveId: string): FederatedTrustRecord | undefined;
  saveTrustRecord(record: FederatedTrustRecord): FederatedTrustRecord;
  getAllTrustRecords(): FederatedTrustRecord[];
}

export interface IFederatedTaskRepository {
  getTask(taskId: string): FederatedTask | undefined;
  saveTask(task: FederatedTask): FederatedTask;
  getAllTasks(): FederatedTask[];
}

export interface IFederatedMemoryRepository {
  getMemory(memoryId: string): FederatedMemoryRecord | undefined;
  saveMemory(record: FederatedMemoryRecord): FederatedMemoryRecord;
  getAllMemories(): FederatedMemoryRecord[];
}

export interface IFederationEventRepository {
  logEvent(event: FederationEvent): FederationEvent;
  getEvents(limit?: number): FederationEvent[];
}

// Deterministic In-Memory Implementations
export class InMemoryHiveRepository implements IHiveRepository {
  private hives = new Map<string, FederatedHiveRecord>();

  constructor() {
    this.seedInitialHives();
  }

  private seedInitialHives() {
    const defaultHives: FederatedHiveRecord[] = [
      {
        identity: {
          hiveId: 'hive-hermes-prime',
          name: 'Hermes Prime Executive Hive',
          description: 'Primary orchestration and executive governance hub',
          publicKey: 'pubkey-pqc-hermes-prime-ed25519-v1',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          federationMembershipState: 'ACTIVE',
          capabilityProfile: ['ORCHESTRATION', 'GOVERNANCE', 'REASONING', 'DECISION_MAKING'],
          version: '1.7.0',
          trustStatus: 'HIGH_TRUST',
          governanceFingerprint: 'gov-fp-sha256-hermes-prime-v1',
          protocolVersion: '7.0',
        },
        state: 'ACTIVE',
        lastSeenHeartbeat: new Date().toISOString(),
        endpoint: 'https://prime.hive.hermes.internal/api/federation',
        reputationScore: 98,
        trustScore: 98,
        quarantineStatus: 'NONE',
        capabilities: ['ORCHESTRATION', 'GOVERNANCE', 'REASONING', 'DECISION_MAKING'],
      },
      {
        identity: {
          hiveId: 'hive-security-gamma',
          name: 'Security & Compliance Hive Gamma',
          description: 'Attestation, PQC signature auditing, and zero-trust verification',
          publicKey: 'pubkey-pqc-sec-gamma-ed25519-v1',
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          federationMembershipState: 'ACTIVE',
          capabilityProfile: ['PQC_ATTESTATION', 'AUDITING', 'SECURITY_ANALYSIS'],
          version: '1.7.0',
          trustStatus: 'TRUSTED',
          governanceFingerprint: 'gov-fp-sha256-sec-gamma-v1',
          protocolVersion: '7.0',
        },
        state: 'ACTIVE',
        lastSeenHeartbeat: new Date().toISOString(),
        endpoint: 'https://gamma.security.hermes.internal/api/federation',
        reputationScore: 94,
        trustScore: 95,
        quarantineStatus: 'NONE',
        capabilities: ['PQC_ATTESTATION', 'AUDITING', 'SECURITY_ANALYSIS'],
      },
      {
        identity: {
          hiveId: 'hive-ops-beta',
          name: 'Operations & Performance Hive Beta',
          description: 'High-throughput execution, token market clearing, vector reindexing',
          publicKey: 'pubkey-pqc-ops-beta-ed25519-v1',
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          federationMembershipState: 'ACTIVE',
          capabilityProfile: ['HIGH_THROUGHPUT_EXECUTION', 'VECTOR_REINDEXING', 'TOKEN_MARKET_CLEARING'],
          version: '1.7.0',
          trustStatus: 'TRUSTED',
          governanceFingerprint: 'gov-fp-sha256-ops-beta-v1',
          protocolVersion: '7.0',
        },
        state: 'ACTIVE',
        lastSeenHeartbeat: new Date().toISOString(),
        endpoint: 'https://beta.ops.hermes.internal/api/federation',
        reputationScore: 92,
        trustScore: 91,
        quarantineStatus: 'NONE',
        capabilities: ['HIGH_THROUGHPUT_EXECUTION', 'VECTOR_REINDEXING', 'TOKEN_MARKET_CLEARING'],
      },
      {
        identity: {
          hiveId: 'hive-research-delta',
          name: 'Research & Foresight Hive Delta',
          description: 'Deep strategic simulations and experimental hypothesis generation',
          publicKey: 'pubkey-pqc-res-delta-ed25519-v1',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          federationMembershipState: 'ACTIVE',
          capabilityProfile: ['STRATEGIC_SIMULATION', 'RESEARCH', 'EXPERIMENTATION'],
          version: '1.7.0',
          trustStatus: 'TRUSTED',
          governanceFingerprint: 'gov-fp-sha256-res-delta-v1',
          protocolVersion: '7.0',
        },
        state: 'ACTIVE',
        lastSeenHeartbeat: new Date().toISOString(),
        endpoint: 'https://delta.research.hermes.internal/api/federation',
        reputationScore: 95,
        trustScore: 94,
        quarantineStatus: 'NONE',
        capabilities: ['STRATEGIC_SIMULATION', 'RESEARCH', 'EXPERIMENTATION'],
      },
    ];

    for (const hive of defaultHives) {
      this.hives.set(hive.identity.hiveId, hive);
    }
  }

  getHive(hiveId: string): FederatedHiveRecord | undefined {
    return this.hives.get(hiveId);
  }

  getAllHives(): FederatedHiveRecord[] {
    return Array.from(this.hives.values());
  }

  upsertHive(hive: FederatedHiveRecord): FederatedHiveRecord {
    this.hives.set(hive.identity.hiveId, hive);
    return hive;
  }

  removeHive(hiveId: string): boolean {
    return this.hives.delete(hiveId);
  }
}

export class InMemoryFederationMessageRepository implements IFederationMessageRepository {
  private messages = new Map<string, FederatedMessage>();
  private processedIds = new Set<string>();

  saveMessage(msg: FederatedMessage): FederatedMessage {
    this.messages.set(msg.messageId, msg);
    this.processedIds.add(msg.messageId);
    return msg;
  }

  getMessage(messageId: string): FederatedMessage | undefined {
    return this.messages.get(messageId);
  }

  getMessagesForHive(hiveId: string): FederatedMessage[] {
    return Array.from(this.messages.values()).filter(
      (m) => m.sourceHiveId === hiveId || m.destinationHiveId === hiveId
    );
  }

  hasProcessedMessage(messageId: string): boolean {
    return this.processedIds.has(messageId);
  }
}

export class InMemoryTrustRepository implements ITrustRepository {
  private trustRecords = new Map<string, FederatedTrustRecord>();

  constructor() {
    this.seedDefaultTrust();
  }

  private seedDefaultTrust() {
    this.saveTrustRecord({
      hiveId: 'hive-hermes-prime',
      trustLevel: 'HIGH_TRUST',
      trustScore: 98,
      verifiedEvidence: ['Initial Root Certification', 'Stage 6 Verification Pass'],
      historicalReliabilityPct: 99.5,
      policyCompliancePct: 100,
      lastEvaluatedAt: new Date().toISOString(),
    });
    this.saveTrustRecord({
      hiveId: 'hive-security-gamma',
      trustLevel: 'TRUSTED',
      trustScore: 95,
      verifiedEvidence: ['PQC Signature Attestation Audit Log'],
      historicalReliabilityPct: 98.2,
      policyCompliancePct: 99.8,
      lastEvaluatedAt: new Date().toISOString(),
    });
  }

  getTrustRecord(hiveId: string): FederatedTrustRecord | undefined {
    return this.trustRecords.get(hiveId);
  }

  saveTrustRecord(record: FederatedTrustRecord): FederatedTrustRecord {
    this.trustRecords.set(record.hiveId, record);
    return record;
  }

  getAllTrustRecords(): FederatedTrustRecord[] {
    return Array.from(this.trustRecords.values());
  }
}

export class InMemoryFederatedTaskRepository implements IFederatedTaskRepository {
  private tasks = new Map<string, FederatedTask>();

  getTask(taskId: string): FederatedTask | undefined {
    return this.tasks.get(taskId);
  }

  saveTask(task: FederatedTask): FederatedTask {
    this.tasks.set(task.taskId, task);
    return task;
  }

  getAllTasks(): FederatedTask[] {
    return Array.from(this.tasks.values());
  }
}

export class InMemoryFederatedMemoryRepository implements IFederatedMemoryRepository {
  private memories = new Map<string, FederatedMemoryRecord>();

  getMemory(memoryId: string): FederatedMemoryRecord | undefined {
    return this.memories.get(memoryId);
  }

  saveMemory(record: FederatedMemoryRecord): FederatedMemoryRecord {
    this.memories.set(record.memoryId, record);
    return record;
  }

  getAllMemories(): FederatedMemoryRecord[] {
    return Array.from(this.memories.values());
  }
}

export class InMemoryFederationEventRepository implements IFederationEventRepository {
  private events: FederationEvent[] = [];

  logEvent(event: FederationEvent): FederationEvent {
    this.events.unshift(event);
    if (this.events.length > 500) {
      this.events.pop();
    }
    return event;
  }

  getEvents(limit = 100): FederationEvent[] {
    return this.events.slice(0, limit);
  }
}

export const hiveRepository = new InMemoryHiveRepository();
export const federationMessageRepository = new InMemoryFederationMessageRepository();
export const trustRepository = new InMemoryTrustRepository();
export const federatedTaskRepository = new InMemoryFederatedTaskRepository();
export const federatedMemoryRepository = new InMemoryFederatedMemoryRepository();
export const federationEventRepository = new InMemoryFederationEventRepository();
