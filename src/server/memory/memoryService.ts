import { MemoryLayer, MemoryRecord } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

class MemoryService {
  private records: Map<string, MemoryRecord> = new Map();

  constructor() {
    this.seedInitialMemory();
  }

  private seedInitialMemory() {
    this.addRecord({
      layer: 'semantic',
      key: 'hermes_swarm_architecture',
      content: 'Hermes Hive operates as an executive-directed multi-agent swarm divided into Clusters A, B, and C connected through a Hive Command Bus.',
      tags: ['architecture', 'hermes', 'hive'],
      confidence: 1.0,
    });

    this.addRecord({
      layer: 'procedural',
      key: 'workflow_security_audit',
      content: 'Security audit procedural workflow: 1. Ingest repository manifest -> 2. Run static security analysis -> 3. Cross-verify with Critic agent -> 4. Synthesize executive report.',
      tags: ['workflow', 'security', 'audit'],
      confidence: 0.95,
    });

    this.addRecord({
      layer: 'procedural',
      key: 'workflow_code_refactoring',
      content: 'Code refactoring procedural workflow: 1. Analyze target components -> 2. Generate optimized solution -> 3. Run regression tests with Tester agent -> 4. Final approval.',
      tags: ['workflow', 'developer', 'testing'],
      confidence: 0.92,
    });
  }

  public addRecord(params: {
    layer: MemoryLayer;
    key: string;
    content: string;
    tags?: string[];
    sourceMissionId?: string;
    sourceAgentId?: string;
    confidence?: number;
  }): MemoryRecord {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: MemoryRecord = {
      id,
      layer: params.layer,
      key: params.key,
      content: params.content,
      tags: params.tags || [],
      sourceMissionId: params.sourceMissionId,
      sourceAgentId: params.sourceAgentId,
      confidence: params.confidence ?? 0.9,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.records.set(id, record);

    messageBus.publish('KNOWLEDGE_SHARED', 'MemoryService', {
      memoryId: id,
      layer: record.layer,
      key: record.key,
      summary: record.content.slice(0, 100),
    }, { missionId: record.sourceMissionId, agentId: record.sourceAgentId, severity: 'info' });

    return record;
  }

  public getRecord(id: string): MemoryRecord | undefined {
    const rec = this.records.get(id);
    if (rec) {
      rec.accessCount++;
      rec.updatedAt = new Date().toISOString();
    }
    return rec;
  }

  public query(options?: {
    layer?: MemoryLayer;
    search?: string;
    tags?: string[];
    limit?: number;
  }): MemoryRecord[] {
    let result = Array.from(this.records.values());

    if (options?.layer) {
      result = result.filter((r) => r.layer === options.layer);
    }

    if (options?.tags && options.tags.length > 0) {
      result = result.filter((r) => options.tags!.some((t) => r.tags.includes(t)));
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  public deleteRecord(id: string): boolean {
    return this.records.delete(id);
  }

  public count(): number {
    return this.records.size;
  }
}

export const memoryService = new MemoryService();
