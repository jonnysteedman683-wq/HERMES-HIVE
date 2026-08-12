import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), process.env.HIVE_DB_PATH ?? '.hive/hive.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  status TEXT,
  lifecycleState TEXT,
  health TEXT,
  clusterId TEXT,
  capabilities TEXT,
  lastHeartbeat TEXT,
  createdAt TEXT,
  reputation TEXT,
  resourceUsage TEXT
);
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT,
  objective TEXT,
  priority INTEGER,
  status TEXT,
  tasks TEXT,
  createdAt TEXT,
  completedAt TEXT,
  resultSummary TEXT
);
CREATE TABLE IF NOT EXISTS memory_records (
  id TEXT PRIMARY KEY,
  layer TEXT,
  key TEXT,
  content TEXT,
  tags TEXT,
  createdAt TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT,
  source TEXT,
  missionId TEXT,
  taskId TEXT,
  agentId TEXT,
  severity TEXT,
  timestamp TEXT,
  payload TEXT
);
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  type TEXT,
  confidence REAL,
  reasoningSummary TEXT,
  actions TEXT,
  timestamp TEXT
);
CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  source TEXT,
  eventType TEXT,
  details TEXT,
  governanceResult TEXT,
  traceId TEXT,
  timestamp TEXT
);
CREATE TABLE IF NOT EXISTS generic_records (
  id TEXT PRIMARY KEY,
  category TEXT,
  payload TEXT,
  createdAt TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  kind TEXT,
  agent_id TEXT,
  agent_role TEXT,
  agent_capabilities TEXT,
  mission_id TEXT,
  status TEXT,
  priority INTEGER,
  prompt TEXT,
  system_prompt TEXT,
  output TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  timeout_ms INTEGER,
  created_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  model_used TEXT,
  verification_score REAL,
  verification_comments TEXT,
  worker_pid INTEGER,
  error_history TEXT,
  context TEXT,
  required_capabilities TEXT,
  tool_name TEXT,
  tool_args TEXT,
  retry_policy TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS workers (
  worker_id TEXT PRIMARY KEY,
  pid INTEGER,
  backend TEXT,
  supported_kinds TEXT,
  max_concurrency INTEGER,
  current_load INTEGER,
  last_heartbeat TEXT,
  started_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_mission ON events(missionId);
CREATE INDEX IF NOT EXISTS idx_events_task ON events(taskId);
CREATE INDEX IF NOT EXISTS idx_memory_layer ON memory_records(layer);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_workers_heartbeat ON workers(last_heartbeat);
`);

export function getDb() {
  return db;
}
