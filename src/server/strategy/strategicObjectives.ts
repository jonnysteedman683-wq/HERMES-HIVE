import { StrategicObjective } from '../../shared/types';

export class StrategicObjectivesManager {
  private objectives: Map<string, StrategicObjective> = new Map();

  constructor() {
    this.seedObjectives();
  }

  private seedObjectives(): void {
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();

    const objs: StrategicObjective[] = [
      {
        id: 'obj-001',
        title: 'Zero-Trust Federation Security Audit',
        description: 'Achieve 100% cryptographic signature verification across all cross-Hive messages',
        priority: 5,
        successCriteria: [
          'All cross-Hive API routes require signed headers',
          'Quarantine score threshold enforced automatically',
          'Zero unauthorized message injection vectors',
        ],
        targetDate: futureDate,
        progressPct: 85,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'obj-002',
        title: 'Autonomous Project Execution Engine',
        description: 'Automatically discover opportunities and convert approved proposals into projects',
        priority: 4,
        successCriteria: [
          'Opportunity engine scans mission history',
          'Project engine generates project graphs',
          'Verification engine audits project artifacts',
        ],
        targetDate: futureDate,
        progressPct: 92,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'obj-003',
        title: 'Swarm Learning & Knowledge Promotion Base',
        description: 'Promote procedural learnings into semantic memory with automated decay management',
        priority: 3,
        successCriteria: [
          'Learning records cross-referenced before strategy selection',
          'Decay engine reduces stale knowledge confidence',
        ],
        targetDate: futureDate,
        progressPct: 100,
        status: 'ACHIEVED',
        createdAt: now,
      },
    ];

    for (const o of objs) {
      this.objectives.set(o.id, o);
    }
  }

  public getAllObjectives(): StrategicObjective[] {
    return Array.from(this.objectives.values());
  }

  public createObjective(params: {
    title: string;
    description: string;
    priority?: number;
    successCriteria: string[];
    targetDateDays?: number;
  }): StrategicObjective {
    const id = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const targetDate = new Date(Date.now() + (params.targetDateDays || 30) * 86400000).toISOString();

    const obj: StrategicObjective = {
      id,
      title: params.title,
      description: params.description,
      priority: params.priority || 3,
      successCriteria: params.successCriteria,
      targetDate,
      progressPct: 0,
      status: 'ACTIVE',
      createdAt: now,
    };

    this.objectives.set(id, obj);
    return obj;
  }
}

export const strategicObjectivesManager = new StrategicObjectivesManager();
