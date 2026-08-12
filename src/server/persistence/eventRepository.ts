import { getDb } from './hiveDatabase';
import { HiveEvent } from '../../shared/types';

export class EventRepository {
  private db = getDb();

  insert(event: HiveEvent) {
    try {
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
    } catch (err) {
      console.error(`[EventRepository.insert] Failed for event ${event.id}:`, err);
      throw err;
    }
  }

  getAll(limit = 1000) {
    try {
      const rows = this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
      return rows.map(this.rowToEvent);
    } catch (err) {
      console.error('[EventRepository.getAll] Failed:', err);
      throw err;
    }
  }

  getByMission(missionId: string, limit = 500) {
    try {
      const rows = this.db.prepare('SELECT * FROM events WHERE missionId = ? ORDER BY timestamp DESC LIMIT ?').all(missionId, limit) as any[];
      return rows.map(this.rowToEvent);
    } catch (err) {
      console.error(`[EventRepository.getByMission] Failed for mission ${missionId}:`, err);
      throw err;
    }
  }

  private rowToEvent(row: any): HiveEvent {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(row.payload || '{}');
    } catch {
      payload = {};
    }
    return {
      ...row,
      payload,
    } as HiveEvent;
  }
}
