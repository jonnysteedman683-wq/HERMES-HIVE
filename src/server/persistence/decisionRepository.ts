import { getDb } from './hiveDatabase';

export interface DecisionRecord {
  id: string;
  type: string;
  confidence: number;
  reasoningSummary: string;
  actions: string;
  timestamp: string;
}

export class DecisionRepository {
  private db = getDb();

  insert(decision: DecisionRecord) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO decisions (id,type,confidence,reasoningSummary,actions,timestamp)
        VALUES (?,?,?,?,?,?)
      `);
      stmt.run(decision.id, decision.type, decision.confidence, decision.reasoningSummary, JSON.stringify(decision.actions), decision.timestamp);
    } catch (err) {
      console.error(`[DecisionRepository.insert] Failed for decision ${decision.id}:`, err);
      throw err;
    }
  }

  getAll(limit = 200) {
    try {
      const rows = this.db.prepare('SELECT * FROM decisions ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
      return rows.map((row) => ({
        ...row,
        actions: this.parseActions(row.actions),
      }));
    } catch (err) {
      console.error('[DecisionRepository.getAll] Failed:', err);
      throw err;
    }
  }

  private parseActions(raw: string | null | undefined): string {
    try {
      return raw ? JSON.parse(raw) : '[]';
    } catch {
      return '[]';
    }
  }
}
