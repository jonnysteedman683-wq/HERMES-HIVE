import { getDb } from './hiveDatabase';
import { Agent } from '../../shared/types';

export class AgentRepository {
  private db = getDb();

  upsert(agent: Agent) {
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
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM agents').all();
    return rows.map(this.rowToAgent);
  }

  get(id: string) {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return row ? this.rowToAgent(row) : undefined;
  }

  delete(id: string) {
    this.db.prepare('DELETE FROM agents WHERE id = ?').run(id);
  }

  private rowToAgent(row: any): Agent {
    return {
      ...row,
      capabilities: JSON.parse(row.capabilities || '[]'),
      reputation: JSON.parse(row.reputation || 'null'),
      resourceUsage: JSON.parse(row.resourceUsage || 'null'),
    } as Agent;
  }
}
