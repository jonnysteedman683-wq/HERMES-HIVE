import { SwarmLearningRecord } from '../../shared/types';
import { messageBus } from '../bus/messageBus';
import { memoryService } from '../memory/memoryService';

export class SwarmLearning {
  private records: Map<string, SwarmLearningRecord> = new Map();

  /**
   * Promote verified mission findings into reusable swarm knowledge
   */
  public promoteValidatedLearning(
    category: SwarmLearningRecord['category'],
    title: string,
    knowledgeContent: string,
    options?: { confidenceScore?: number; sourceMissionId?: string; verificationValidated?: boolean }
  ): SwarmLearningRecord {
    const id = `lrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isValidated = options?.verificationValidated ?? true;
    const confidence = options?.confidenceScore ?? 0.95;

    const record: SwarmLearningRecord = {
      id,
      category,
      title,
      knowledgeContent,
      confidenceScore: confidence,
      verificationValidated: isValidated,
      sourceMissionId: options?.sourceMissionId,
      promotedToSemanticMemory: isValidated && confidence >= 0.85,
      createdAt: new Date().toISOString(),
    };

    this.records.set(id, record);

    // If validated with high confidence, persist to semantic memory service
    if (record.promotedToSemanticMemory) {
      memoryService.addRecord({
        layer: 'semantic',
        key: `learning:${category}:${id}`,
        content: `[${title}] ${knowledgeContent}`,
        tags: ['swarm_learning', category],
        sourceMissionId: options?.sourceMissionId,
        confidence,
      });
    }

    messageBus.publish('LEARNING_PROMOTED', 'SwarmLearning', {
      learning: record,
    }, {
      missionId: options?.sourceMissionId,
      severity: 'info',
    });

    return record;
  }

  public getAllLearning(): SwarmLearningRecord[] {
    return Array.from(this.records.values());
  }
}

export const swarmLearning = new SwarmLearning();
