import { getDb } from './hiveDatabase';
import { Agent } from '../../shared/types';

export class AgentRepository {
  private db = getDb();

  upsert(agent: Agent) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO agents (id,name,role,status,lifecycleState,health,clusterId,capabilities,lastHeartbeat,createdAt,reputation,resourceUsage)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          role=excluded.role,
          status=excluded.status,
          lifecycleState=excluded.lifecycleState,
          health=excluded.health,
          clusterId=excluded.clusterId,
          capabilities=excluded.capabilities,
          lastHeartbeat=excluded.lastHeartbeat,
          reputation=excluded.reputation,
          resourceUsage=excluded.resourceUsage
      `);
      stmt.run(
        agent.id,
        agent.name,
        agent.role,
        agent.status,
        agent.lifecycleState,
        agent.health,
        agent.clusterId,
        JSON.stringify(agent.capabilities),
        agent.lastHeartbeat,
        agent.createdAt,
        JSON.stringify(agent.reputation),
        JSON.stringify(agent.resourceUsage)
      );
    } catch (err) {
      console.error(`[AgentRepository.upsert] Failed for agent ${agent.id}:`, err);
      throw err;
    }
  }

  getAll() {
    try {
      const rows = this.db.prepare('SELECT * FROM agents').all();
      return rows.map(this.rowToAgent);
    } catch (err) {
      console.error('[AgentRepository.getAll] Failed:', err);
      throw err;
    }
  }

  get(id: string) {
    try {
      const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
      return row ? this.rowToAgent(row) : undefined;
    } catch (err) {
      console.error(`[AgentRepository.get] Failed for id ${id}:`, err);
      throw err;
    }
  }

  delete(id: string) {
    try {
      this.db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    } catch (err) {
      console.error(`[AgentRepository.delete] Failed for id ${id}:`, err);
      throw err;
    }
  }

  private rowToAgent(row: any): Agent {
    const parse = (raw: string | null | undefined, fallback: unknown): unknown => {
      try {
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    return {
      ...row,
      capabilities: parse(row.capabilities, []),
      reputation: parse(row.reputation, null),
      resourceUsage: parse(row.resourceUsage, null),
    } as Agent;
  }
}
