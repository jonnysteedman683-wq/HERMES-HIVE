import { getDb } from './hiveDatabase';
import { Mission } from '../../shared/types';

export class MissionRepository {
  private db = getDb();

  upsert(mission: Mission) {
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
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM missions').all();
    return rows.map(this.rowToMission);
  }

  get(id: string) {
    const row = this.db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
    return row ? this.rowToMission(row) : undefined;
  }

  private rowToMission(row: any): Mission {
    return {
      ...row,
      tasks: JSON.parse(row.tasks || '[]'),
    } as Mission;
  }
}
