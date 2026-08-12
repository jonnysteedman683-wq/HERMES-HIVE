import { getDb } from './hiveDatabase';
import { Mission } from '../../shared/types';

export class MissionRepository {
  private db = getDb();

  upsert(mission: Mission) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO missions (id,title,objective,priority,status,tasks,createdAt,completedAt,resultSummary)
        VALUES (?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          status=excluded.status,
          tasks=excluded.tasks,
          completedAt=excluded.completedAt,
          resultSummary=excluded.resultSummary
      `);
      stmt.run(
        mission.id,
        mission.title,
        mission.objective,
        mission.priority,
        mission.status,
        JSON.stringify(mission.tasks),
        mission.createdAt,
        mission.result?.completedAt || null,
        mission.result?.summary || null
      );
    } catch (err) {
      console.error(`[MissionRepository.upsert] Failed for mission ${mission.id}:`, err);
      throw err;
    }
  }

  getAll() {
    try {
      const rows = this.db.prepare('SELECT * FROM missions').all();
      return rows.map(this.rowToMission);
    } catch (err) {
      console.error('[MissionRepository.getAll] Failed:', err);
      throw err;
    }
  }

  get(id: string) {
    try {
      const row = this.db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
      return row ? this.rowToMission(row) : undefined;
    } catch (err) {
      console.error(`[MissionRepository.get] Failed for id ${id}:`, err);
      throw err;
    }
  }

  private rowToMission(row: any): Mission {
    const parse = (raw: string | null | undefined, fallback: unknown): unknown => {
      try {
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    return {
      ...row,
      tasks: parse(row.tasks, []),
    } as Mission;
  }
}
