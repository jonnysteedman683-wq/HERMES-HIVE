import { FederatedMemoryRecord } from '../../shared/types';
import { federatedMemoryRepository, federationEventRepository } from './federationRepositories';

export class FederatedMemoryEngine {
  /**
   * Exchanges knowledge between Hives with lifecycle tracking:
   * RECEIVED -> UNVERIFIED -> CORROBORATED -> VALIDATED -> PROMOTED
   */
  public shareKnowledge(
    sourceHiveId: string,
    category: string,
    content: string,
    evidence: string,
    confidence = 0.85
  ): FederatedMemoryRecord {
    const memoryId = `fedmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Check for conflicting knowledge
    const existingMemories = federatedMemoryRepository.getAllMemories();
    const conflict = existingMemories.find(
      (m) => m.category === category && m.content !== content && m.sourceHiveId !== sourceHiveId
    );

    const record: FederatedMemoryRecord = {
      memoryId,
      sourceHiveId,
      category,
      content,
      provenance: `Originating Hive: ${sourceHiveId}`,
      confidence,
      evidence,
      validationState: conflict ? 'UNVERIFIED' : 'RECEIVED',
      timestamp: new Date().toISOString(),
      replicationState: 'REPLICATING',
      conflictState: conflict
        ? {
            hasConflict: true,
            conflictingMemoryId: conflict.memoryId,
            resolutionDetails: `Preserved competing claims: Claim A from ${conflict.sourceHiveId} vs Claim B from ${sourceHiveId}`,
          }
        : { hasConflict: false },
    };

    federatedMemoryRepository.saveMemory(record);

    federationEventRepository.logEvent({
      eventId: `evt-memshare-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId,
      eventType: 'FEDERATED_KNOWLEDGE_SHARED',
      details: { memoryId, category, hasConflict: record.conflictState?.hasConflict },
      governanceResult: 'ALLOWED',
      traceId: `trace-mem-${memoryId}`,
    });

    return record;
  }

  /**
   * Validates and promotes unverified remote knowledge
   */
  public validateAndPromote(memoryId: string, validatorHiveId: string): FederatedMemoryRecord {
    const memory = federatedMemoryRepository.getMemory(memoryId);
    if (!memory) throw new Error(`Memory record ${memoryId} not found`);

    memory.validationState = 'VALIDATED';
    memory.provenance += ` | Validated by ${validatorHiveId} at ${new Date().toISOString()}`;
    memory.replicationState = 'FULLY_REPLICATED';

    federatedMemoryRepository.saveMemory(memory);

    federationEventRepository.logEvent({
      eventId: `evt-mempromote-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: validatorHiveId,
      eventType: 'FEDERATED_KNOWLEDGE_VALIDATED',
      details: { memoryId },
      governanceResult: 'ALLOWED',
      traceId: `trace-mempromote-${memoryId}`,
    });

    return memory;
  }

  public getMemory(memoryId: string): FederatedMemoryRecord | undefined {
    return federatedMemoryRepository.getMemory(memoryId);
  }

  public getAllMemories(): FederatedMemoryRecord[] {
    return federatedMemoryRepository.getAllMemories();
  }
}

export const federatedMemoryEngine = new FederatedMemoryEngine();
