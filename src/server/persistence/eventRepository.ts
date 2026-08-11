import { getDb } from './hiveDatabase';
import { HiveEvent } from '../../shared/types';

export class EventRepository {
  private db = getDb();

  insert(event: HiveEvent) {
    const stmt = this.db.prepare(`
      INSERT INTO events (id,type,source,missionId,taskId,agentId,severity,timestamp,payload)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    stmt.run(
      event.id,
      event.type,
      event.source,
      event.missionId || null,
      event.taskId || null,
      event.agentId || null,
      event.severity || 'info',
      event.timestamp,
      JSON.stringify(event.payload || {})
    );
  }

  getAll(limit = 1000) {
    const rows = this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map(this.rowToEvent);
  }

  getByMission(missionId: string, limit = 500) {
    const rows = this.db.prepare('SELECT * FROM events WHERE missionId = ? ORDER BY timestamp DESC LIMIT ?').all(missionId, limit) as any[];
    return rows.map(this.rowToEvent);
  }

  private rowToEvent(row: any): HiveEvent {
    return {
      ...row,
      payload: JSON.parse(row.payload || '{}'),
    } as HiveEvent;
  }
}
