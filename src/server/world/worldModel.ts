import { WorldEntity, WorldEntityType, WorldRelationship, WorldRelationType } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export class WorldModel {
  private entities: Map<string, WorldEntity> = new Map();
  private relationships: Map<string, WorldRelationship> = new Map();

  constructor() {
    this.seedDefaultEnvironment();
  }

  private seedDefaultEnvironment() {
    // Seed system entities
    this.addEntity('sys-hermes-core', 'Hermes Swarm Runtime', 'System', 'Central swarm orchestration runtime', { status: 'ONLINE', version: '2.0.0' });
    this.addEntity('repo-hermes-hive', 'hermes-hive-main', 'Repository', 'Primary code repository containing agent micro-services', { branch: 'main', dirty: false });
    this.addEntity('svc-gemini-provider', 'Gemini AI Gateway', 'Service', 'Google GenAI SDK provider service', { rateLimit: 'OK', model: 'gemini-3.6-flash' });
    this.addEntity('svc-message-bus', 'Hermes Message Bus', 'Service', 'Real-time event transport and DLQ broker', { throughput: 'HIGH' });

    // Seed relationships
    this.addRelationship('sys-hermes-core', 'repo-hermes-hive', 'OWNS');
    this.addRelationship('sys-hermes-core', 'svc-gemini-provider', 'USES');
    this.addRelationship('sys-hermes-core', 'svc-message-bus', 'USES');
  }

  /**
   * Add or update an entity in the World Model
   */
  public addEntity(
    id: string,
    name: string,
    type: WorldEntityType,
    description: string,
    state: Record<string, unknown> = {}
  ): WorldEntity {
    const now = new Date().toISOString();
    const entity: WorldEntity = {
      id,
      name,
      type,
      description,
      state,
      createdAt: this.entities.has(id) ? this.entities.get(id)!.createdAt : now,
      updatedAt: now,
    };

    this.entities.set(id, entity);

    messageBus.publish('WORLD_MODEL_UPDATED', 'WorldModel', {
      action: 'ADD_ENTITY',
      entity,
    }, { severity: 'info' });

    return entity;
  }

  /**
   * Add a directed relationship between two entities
   */
  public addRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationType: WorldRelationType,
    metadata?: Record<string, unknown>
  ): WorldRelationship {
    const id = `rel-${sourceEntityId}-${relationType}-${targetEntityId}`;
    const rel: WorldRelationship = {
      id,
      sourceEntityId,
      targetEntityId,
      relationType,
      metadata,
    };

    this.relationships.set(id, rel);

    messageBus.publish('WORLD_MODEL_UPDATED', 'WorldModel', {
      action: 'ADD_RELATIONSHIP',
      relationship: rel,
    }, { severity: 'info' });

    return rel;
  }

  public getEntities(): WorldEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Query entities by filter
   */
  public queryEntities(filter?: { type?: WorldEntityType; search?: string }): WorldEntity[] {
    let result = Array.from(this.entities.values());

    if (filter) {
      if (filter.type) {
        result = result.filter((e) => e.type === filter.type);
      }
      if (filter.search) {
        const query = filter.search.toLowerCase();
        result = result.filter(
          (e) => e.name.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)
        );
      }
    }

    return result;
  }

  /**
   * Get all relationships associated with an entity ID
   */
  public getEntityRelationships(entityId: string): WorldRelationship[] {
    return Array.from(this.relationships.values()).filter(
      (r) => r.sourceEntityId === entityId || r.targetEntityId === entityId
    );
  }

  /**
   * Update state of a entity
   */
  public updateEntityState(id: string, stateUpdates: Record<string, unknown>): WorldEntity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    entity.state = { ...entity.state, ...stateUpdates };
    entity.updatedAt = new Date().toISOString();

    messageBus.publish('WORLD_MODEL_UPDATED', 'WorldModel', {
      action: 'UPDATE_ENTITY',
      entity,
    }, { severity: 'info' });

    return entity;
  }

  /**
   * Get complete graph payload for UI visualization
   */
  public getWorldGraph(): { entities: WorldEntity[]; relationships: WorldRelationship[] } {
    return {
      entities: Array.from(this.entities.values()),
      relationships: Array.from(this.relationships.values()),
    };
  }
}

export const worldModel = new WorldModel();
