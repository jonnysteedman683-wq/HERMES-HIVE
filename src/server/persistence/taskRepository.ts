import { getDb } from './hiveDatabase';
import { TaskRecord, TaskQueueStatus, WorkerRegistration } from '../../shared/types';

export interface TaskFilter {
  status?: TaskQueueStatus | TaskQueueStatus[];
  missionId?: string;
  agentId?: string;
  kind?: string | string[];
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export class TaskRepository {
  private db = getDb();

  /**
   * Insert or update a task record
   */
  upsert(task: TaskRecord): void {
    const columns = [
      'id', 'kind', 'agent_id', 'agent_role', 'agent_capabilities', 'mission_id',
      'status', 'priority', 'prompt', 'system_prompt', 'output', 'error',
      'retry_count', 'max_retries', 'timeout_ms', 'created_at', 'started_at',
      'completed_at', 'tokens_used', 'latency_ms', 'model_used',
      'verification_score', 'verification_comments', 'worker_pid',
      'error_history', 'context', 'required_capabilities',
      'tool_name', 'tool_args', 'retry_policy', 'updated_at',
    ];
    const placeholders = columns.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      INSERT INTO tasks (${columns.join(',')})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        agent_role = excluded.agent_role,
        agent_capabilities = excluded.agent_capabilities,
        system_prompt = excluded.system_prompt,
        output = excluded.output,
        error = excluded.error,
        retry_count = excluded.retry_count,
        max_retries = excluded.max_retries,
        timeout_ms = excluded.timeout_ms,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        tokens_used = excluded.tokens_used,
        latency_ms = excluded.latency_ms,
        model_used = excluded.model_used,
        verification_score = excluded.verification_score,
        verification_comments = excluded.verification_comments,
        worker_pid = excluded.worker_pid,
        error_history = excluded.error_history,
        context = excluded.context,
        required_capabilities = excluded.required_capabilities,
        tool_name = excluded.tool_name,
        tool_args = excluded.tool_args,
        retry_policy = excluded.retry_policy,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      task.taskId,
      task.kind,
      task.agentId || null,
      task.agentRole || null,
      JSON.stringify(task.agentCapabilities || []),
      task.context?.missionId || null,
      task.status,
      task.priority || 3,
      task.prompt,
      task.systemPrompt || null,
      task.output || null,
      task.error || null,
      task.retryCount,
      task.retryPolicy?.maxRetries || 3,
      task.timeoutMs || null,
      task.createdAt || new Date().toISOString(),
      task.startedAt || null,
      task.completedAt || null,
      task.tokensUsed || 0,
      task.latencyMs || 0,
      task.modelUsed || null,
      task.verificationScore || null,
      task.verificationComments || null,
      task.workerPid || null,
      JSON.stringify(task.errorHistory || []),
      JSON.stringify(task.context || {}),
      JSON.stringify(task.requiredCapabilities || []),
      task.toolName || null,
      JSON.stringify(task.toolArgs || {}),
      JSON.stringify(task.retryPolicy || null),
      new Date().toISOString(),
    );
  }

  /**
   * Find tasks ready for execution (queued, ordered by priority)
   * Atomically claim a task by setting worker_pid (only works if currently unclaimed)
   */
  claimTask(taskId: string, workerPid: number): boolean {
    try {
      const result = this.db.prepare(`
        UPDATE tasks
        SET status = 'running', worker_pid = ?, started_at = ?
        WHERE id = ? AND status = 'queued'
      `).run(workerPid, new Date().toISOString(), taskId);

      return result.changes > 0;
    } catch {
      return false;
    }
  }

  /**
   * Find queued tasks that match the given kinds (for worker polling)
   */
  findQueuedTasks(limit: number, kinds?: string[]): TaskRecord[] {
    let sql = `
      SELECT * FROM tasks
      WHERE status = 'queued'
      AND (worker_pid IS NULL OR worker_pid = ?)
      ORDER BY priority ASC, created_at ASC
      LIMIT ?
    `;
    const params: any[] = [process.pid, limit];

    if (kinds && kinds.length > 0) {
      sql = `
        SELECT * FROM tasks
        WHERE status = 'queued'
        AND kind IN (${kinds.map(() => '?').join(',')})
        AND (worker_pid IS NULL OR worker_pid = ?)
        ORDER BY priority ASC, created_at ASC
        LIMIT ?
      `;
      // Replace the base params so they line up with the new placeholder order:
      // kind IN (N ?), worker_pid = ?, LIMIT ?  ->  [kinds..., pid, limit]
      params.length = 0;
      params.push(...kinds, process.pid, limit);
    }

    const rows = this.db.prepare(sql).all(...params);
    return rows.map(this.rowToTask);
  }

  /**
   * Update task status
   */
  updateStatus(taskId: string, status: TaskQueueStatus): void {
    this.db.prepare(`
      UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?
    `).run(status, new Date().toISOString(), taskId);
  }

  /**
   * Update task execution result
   */
  updateResult(
    taskId: string,
    updates: {
      status?: TaskQueueStatus;
      output?: string;
      error?: string;
      tokensUsed?: number;
      latencyMs?: number;
      modelUsed?: string;
      verificationScore?: number;
      verificationComments?: string;
      completedAt?: string;
      workerPid?: number;
    }
  ): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.output !== undefined) {
      fields.push('output = ?');
      values.push(updates.output);
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.tokensUsed !== undefined) {
      fields.push('tokens_used = ?');
      values.push(updates.tokensUsed);
    }
    if (updates.latencyMs !== undefined) {
      fields.push('latency_ms = ?');
      values.push(updates.latencyMs);
    }
    if (updates.modelUsed !== undefined) {
      fields.push('model_used = ?');
      values.push(updates.modelUsed);
    }
    if (updates.verificationScore !== undefined) {
      fields.push('verification_score = ?');
      values.push(updates.verificationScore);
    }
    if (updates.verificationComments !== undefined) {
      fields.push('verification_comments = ?');
      values.push(updates.verificationComments);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt);
    }
    if (updates.workerPid !== undefined) {
      fields.push('worker_pid = ?');
      values.push(updates.workerPid);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(taskId);

    if (fields.length === 1) return; // no fields to update

    this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  /**
   * Record an error in the task's error history
   */
  recordError(taskId: string, error: string, attempt: number): void {
    const task = this.get(taskId);
    if (!task) return;

    const history = task.errorHistory || [];
    history.push({ timestamp: new Date().toISOString(), error, attempt });

    this.db.prepare(`
      UPDATE tasks SET error_history = ?, updated_at = ? WHERE id = ?
    `).run(JSON.stringify(history), new Date().toISOString(), taskId);
  }

  /**
   * Get a single task by ID
   */
  get(taskId: string): TaskRecord | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    return row ? this.rowToTask(row as any) : undefined;
  }

  /**
   * Query tasks with filtering
   */
  query(filter: TaskFilter = {}): TaskRecord[] {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        sql += ` AND status IN (${filter.status.map(() => '?').join(',')})`;
        filter.status.forEach((s) => params.push(s));
      } else {
        sql += ' AND status = ?';
        params.push(filter.status);
      }
    }

    if (filter.missionId) {
      sql += ' AND mission_id = ?';
      params.push(filter.missionId);
    }

    if (filter.agentId) {
      sql += ' AND agent_id = ?';
      params.push(filter.agentId);
    }

    if (filter.kind) {
      if (Array.isArray(filter.kind)) {
        sql += ` AND kind IN (${filter.kind.map(() => '?').join(',')})`;
        filter.kind.forEach((k) => params.push(k));
      } else {
        sql += ' AND kind = ?';
        params.push(filter.kind);
      }
    }

    const sortOrder = filter.sortOrder || 'desc';
    sql += ` ORDER BY created_at ${sortOrder}`;

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(this.rowToTask);
  }

  /**
   * Get task statistics
   */
  getStats(): {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    timeout: number;
  } {
    const stmt = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks GROUP BY status
    `);
    const rows = stmt.all() as any[];
    const stats = { total: 0, queued: 0, running: 0, completed: 0, failed: 0, cancelled: 0, timeout: 0 };

    for (const row of rows) {
      stats.total += row.count;
      const key = row.status as keyof typeof stats;
      if (key in stats) {
        stats[key] = row.count;
      }
    }

    return stats;
  }

  /**
   * Register a worker heartbeat
   */
  upsertWorker(reg: WorkerRegistration): void {
    this.db.prepare(`
      INSERT INTO workers (worker_id, pid, backend, supported_kinds, max_concurrency, current_load, last_heartbeat, started_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(worker_id) DO UPDATE SET
        pid = excluded.pid,
        current_load = excluded.current_load,
        last_heartbeat = excluded.last_heartbeat,
        supported_kinds = excluded.supported_kinds
    `).run(
      reg.workerId,
      reg.pid,
      reg.backend,
      JSON.stringify(reg.supportedTaskKinds),
      reg.maxConcurrency,
      reg.currentLoad,
      reg.lastHeartbeat,
      reg.startedAt,
    );
  }

  /**
   * Get all active workers
   */
  getWorkers(): any[] {
    const stale = new Date(Date.now() - 30000).toISOString(); // 30s timeout
    return this.db.prepare(`
      SELECT * FROM workers WHERE last_heartbeat > ? ORDER BY started_at ASC
    `).all(stale);
  }

  private rowToTask(row: any): TaskRecord {
    return {
      taskId: row.id,
      kind: row.kind,
      agentId: row.agent_id,
      systemPrompt: row.system_prompt,
      prompt: row.prompt,
      requiredCapabilities: row.required_capabilities ? JSON.parse(row.required_capabilities) : [],
      timeoutMs: row.timeout_ms,
      retryPolicy: row.retry_policy ? JSON.parse(row.retry_policy) : undefined,
      priority: row.priority,
      context: row.context ? JSON.parse(row.context) : {},
      status: row.status as TaskQueueStatus,
      output: row.output,
      error: row.error,
      tokensUsed: row.tokens_used,
      latencyMs: row.latency_ms,
      modelUsed: row.model_used,
      verificationScore: row.verification_score,
      verificationComments: row.verification_comments,
      retryCount: row.retry_count,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      workerPid: row.worker_pid,
      errorHistory: row.error_history ? JSON.parse(row.error_history) : [],
      agentRole: row.agent_role,
      agentCapabilities: row.agent_capabilities ? JSON.parse(row.agent_capabilities) : undefined,
    } as TaskRecord;
  }
}
