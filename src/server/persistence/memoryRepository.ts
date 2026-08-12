import { getDb } from './hiveDatabase';

export interface MemoryRecord {
  id: string;
  layer: string;
  key: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export class MemoryRepository {
  private db = getDb();

  insert(record: MemoryRecord) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO memory_records (id,layer,key,content,tags,createdAt)
        VALUES (?,?,?,?,?,?)
      `);
      stmt.run(record.id, record.layer, record.key, record.content, JSON.stringify(record.tags), record.createdAt);
    } catch (err) {
      console.error(`[MemoryRepository.insert] Failed for record ${record.id}:`, err);
      throw err;
    }
  }

  query({ layer, search }: { layer?: string; search?: string } = {}) {
    try {
      let sql = 'SELECT * FROM memory_records WHERE 1=1';
      const params: any[] = [];
      if (layer) {
        sql += ' AND layer = ?';
        params.push(layer);
      }
      if (search) {
        sql += ' AND (key LIKE ? OR content LIKE ? OR tags LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY createdAt DESC';
      const rows = this.db.prepare(sql).all(...params) as any[];
      return rows.map((row) => ({
        ...row,
        tags: this.parseTags(row.tags),
      }));
    } catch (err) {
      console.error('[MemoryRepository.query] Failed:', err);
      throw err;
    }
  }

  private parseTags(raw: string | null | undefined): string[] {
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
