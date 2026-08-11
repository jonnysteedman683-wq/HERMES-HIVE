# Hermes Hive — Implementation Plan: Distributed Agent Task Queue & Scalable Execution

**Generated:** August 12, 2026  
**Author:** Current session (coordinating with 2 active Hermes instances already working on the codebase)  
**Phase:** Tier 1 — Production-Readiness (Agent Execution Layer)

---

## 1. Current State Summary

The two active Hermes instances have already completed significant foundational work:

### Already Done (by previous sessions):
1. **✅ LLM Provider Abstraction** (`src/server/llm/llmProvider.ts` → 432 lines)
   - Gemini provider with 3s timeout, 60s rate-limit backoff
   - OpenAI-compatible provider (supports remote API + localhost: Ollama, LM Studio)
   - Groq support
   - **ChainProvider** that tries providers in order and falls back through the chain
   - Local fallback reasoner when all providers fail
   - Runtime provider switching via `resetLlmProvider()`

2. **✅ Backend Abstraction Layer** (`src/server/backends/`)
   - `BackendRegistry` — plugin-style adapter registration
   - `OmnibusBackendAdapter` — HTTP bridge to external swarm backends
   - `SuprimeBridge` — direct integration with Suprime decentralized swarm
   - Both registered in `apiMiddleware.ts` with full CRUD routes

3. **✅ Suprime Integration** (`src/server/suprime/suprimeBridge.ts`)
   - Swarm start/stop/status/health
   - Task submission, listing, worker registration
   - Command mirroring (Hermes commands → Suprime tasks)

4. **✅ SQLite Persistence** (`src/server/persistence/`)
   - `hiveDatabase.ts` — WAL mode, 6 tables (agents, missions, events, memory_records, decisions, ledger)
   - `AgentRepository` — upsert + load all agents from DB
   - `MissionRepository` — upsert + query missions
   - `EventRepository` — event stream persistence
   - `MemoryRepository` + `DecisionRepository`

5. **✅ Frontend Components**
   - `SuprimeSwarmView.tsx` — full UI for Suprime swarm status, task submission, worker registration
   - `BackendsView.tsx` — backend registry overview with health checks

6. **✅ Type System Expansion**
   - Extended `HiveEventType` with 9 new event types
   - Added `critical` severity level
   - Added `providerName` to `DiagnosticsMetrics`

### What's NOT yet done (the gap we're filling):

| Gap | Current State | Problem |
|---|---|---|
| **Task Execution** | `missionEngine.executeTask()` runs inline in-process, concurrency limited to `maxConcurrency=4` | Single-process bottleneck; agents die with the process; no task retries/pause/resume across restarts |
| **Agent Isolation** | All agents run as in-process LLM calls via `geminiProvider` | No sandboxing; no resource limits; a misbehaving agent can crash the entire server |
| **Task Persistence** | Tasks exist only in the in-memory `missions` Map | If the server crashes mid-task, all progress is lost |
| **Horizontal Scaling** | Everything is `Map` + `setTimeout` | Can't scale to more agents than one Node process can handle |

---

## 2. Architecture Vision (Target State)

```
┌──────────────────────────────────────────────────────────────────┐
│                        HERMES HIVE CLIENT                        │
│  React SPA (Vite + Tailwind) — 15+ views                         │
└──────────────┬──────────────────────────────────────────┬────────┘
               │ HTTP/SSE (Vite Proxy)                      │
┌──────────────▼──────────────────────────────────────────▼────────┐
│                     API MIDDLEWARE (Vite Plugin)                 │
│  /api/* REST + /api/events/stream SSE                            │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Backend   │  │ TaskRunner   │  │ LLM Provider │              │
│  │ Registry  │  │ Service      │  │ Pool         │              │
│  └───────────┘  └──────┬───────┘  └──────┬───────┘              │
│                        │                 │                       │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                    Message Bus                         │      │
│  │  (in-process pub/sub + SQLite event store)              │      │
│  └────────────────────────────────────────────────────────┘      │
│         │           │           │           │                    │
│  ┌──────▼───┐ ┌─────▼──┐ ┌──────▼──┐ ┌──────▼──┐ ┌──────────┐   │
│  │ Registry │ │ Mission │ │ Hermes  │ │ Collective│ │ Evolution│   │
│  │ Agents   │ │ Engine  │ │ Engine  │ │ Engines  │ │ Engines  │   │
│  └──────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────┘   │
└──────────────────────────────────────────────────────────────────┘
               │
         ┌─────┴────────────────────────────────────────┐
         │  DISTRIBUTED TASK EXECUTION LAYER            │
         │                                              │
         │  ┌──────────────┐  ┌──────────────┐         │
         │  │  Task Worker  │  │  Task Worker │ ...     │
         │  │  (process 1)  │  │  (process N) │         │
         │  │  ┌─────────┐  │  │  ┌─────────┐ │         │
         │  │  │ Agent   │  │  │  │ Agent   │ │         │
         │  │  │ Runner  │  │  │  │ Runner  │ │         │
         │  │  └─────────┘  │  │  └─────────┘ │         │
         │  └──────────────┘  └──────────────┘         │
         │                                              │
         │  BullMQ / Redis Task Queue                   │
         │  (or PostgreSQL LISTEN/NOTIFY for no-dep)     │
         └──────────────────────────────────────────────┘
```

---

## 3. Implementation Phases

### Phase 1: Fix the TypeScript Error & Stabilize Build ✅ (30 min)

**Problem:** The `llmProvider.ts` file has `***` placeholders where secret values were redacted, and there may be a `latencyMs` scope issue.

**Fix:** Replace the `***` placeholders with proper string values. The file appears to have been corrupted by an automated secret-redaction tool that replaced API key variable declarations with `***`.

**Lines to fix (5 occurrences):**
- Line 211: `private apiKey: ***;` → `private apiKey: string;`
- Line 252: `...(this.hasApiKey() ? { Authorization: *** ${this.apiKey}` } : {}),` → `...(this.hasApiKey() ? { Authorization: \`Bearer ${this.apiKey}\` }` : {}),`
- Line 370: `{ apiKey: *** baseUrl: ... }` → `{ apiKey: config?.apiKey || openAiBase, baseUrl: config?.baseUrl || openAiBase, ... }`
- Line 377: Same pattern
- Line 386: Same pattern  
- Line 394: Same pattern
- Line 395: Same pattern
- Line 404: Same pattern
- Line 405: Same pattern

**Verification:** `bun run lint` passes with zero errors.

### Phase 2: TaskRunnerService — Distributed Task Execution (2-3 days)

#### 2.1: Create `src/server/tasks/taskRunner.ts`

A new service that abstracts task execution away from the in-process model. It provides:

```typescript
class TaskRunnerService {
  // Submit a task to the queue — returns immediately with a taskId
  async submitTask(task: TaskSpec): Promise<string>

  // Queue a task for an agent to process (distributed or local)
  async queueTask(taskSpec: TaskSpec): Promise<TaskRecord>

  // Get task status (supports both local and remote workers)
  async getTaskStatus(taskId: string): Promise<TaskStatus>

  // Get execution result (blocks if still running)
  async awaitResult(taskId: string, timeoutMs?: number): Promise<TaskResult>

  // Cancel / pause / resume a task
  async cancelTask(taskId: string): Promise<boolean>
  async pauseTask(taskId: string): Promise<boolean>
  async resumeTask(taskId: string): Promise<boolean>

  // Worker registration — backends register as workers for specific task kinds
  registerWorker(worker: TaskWorker): (() => void)

  // Health check — which backends are available
  getBackendHealth(): Record<string, BackendHealth>
}
```

**TaskSpec:**
```typescript
interface TaskSpec {
  taskId: string           // unique ID (from mission task id)
  kind: string             // 'agent_llm', 'tool_execute', 'hermes_command', 'suprime_task'
  agentId?: string         // which agent to assign (if applicable)
  agentRole?: AgentRole
  systemPrompt?: string    // the agent's system prompt
  prompt: string            // the actual task to execute
  requiredCapabilities?: string[]
  timeoutMs?: number        // max execution time
  retryPolicy?: { maxRetries: number; backoffMs: number }
  context?: Record<string, unknown>  // mission, objective, etc.
}
```

**TaskResult:**
```typescript
interface TaskResult {
  taskId: string
  status: 'completed' | 'failed' | 'cancelled' | 'timeout'
  output?: string
  error?: string
  tokensUsed?: number
  latencyMs?: number
  modelUsed?: string
  verificationScore?: number
}
```

#### 2.2: TaskRepository (`src/server/persistence/taskRepository.ts`)

SQLite table:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  mission_id TEXT,
  agent_id TEXT,
  kind TEXT,
  status TEXT,        -- queued, running, completed, failed, cancelled, timeout
  prompt TEXT,
  output TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 3,
  created_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  model_used TEXT,
  verification_score REAL,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
```

#### 2.3: Worker Process Model

**Option A: Redis + BullMQ (Recommended for production)**
- Add `bullmq` and `ioredis` to dependencies
- `TaskRunnerService` uses BullMQ Queue + Worker
- Worker processes can be spawned as separate Node processes
- `hermes hive worker --concurrency=4` CLI command

**Option B: PostgreSQL LISTEN/NOTIFY (Zero-dependency alternative)**
- Uses the existing better-sqlite3 database with polling
- No external Redis dependency
- Workers poll the DB for tasks with `status='queued'`
- Simpler for single-host deployment

**Implementation choice:** Start with **Option B** (SQLite polling) for immediate value, with an interface that makes it trivial to swap in BullMQ/Redis later.

#### 2.4: Worker Bootstrap (`src/server/tasks/taskWorker.ts`)

A standalone Node process that:
1. Reads `HERMES_WORKER_CONCURRENCY` env var (default: 4)
2. Polls `tasks` table for `status='queued'` tasks
3. Assigns to available local agents (or spawns new ones)
4. Executes via `llmProvider` → `verificationEngine` → result
5. Updates task status, publishes `TASK_*` events to MessageBus
6. Handles retries with exponential backoff
7. Supports graceful shutdown on SIGTERM

Worker selection logic:
```
For each queued task:
  1. Try to find an idle agent matching role + capabilities (from agentRegistry)
  2. If no agent available, spawn a new specialist via AgentFactory
  3. If max local concurrency reached, leave task in queue (waiting for another worker process)
```

### Phase 3: Integrate TaskRunnerService into MissionEngine (1 day)

Modify `missionEngine.executeTask()`:

**Before (inline execution):**
```typescript
// Directly calls geminiProvider and runs verification in-process
const llmRes = await geminiProvider.generate({...})
const verificationResult = await verificationEngine.verifyTaskOutput(task, executionOutput)
```

**After (delegated to TaskRunnerService):**
```typescript
// Submit task to distributed queue — can run on any worker
const taskId = await taskRunner.submitTask({
  taskId: task.id,
  kind: 'agent_llm',
  agentId: agent.id,
  agentRole: task.requiredRole,
  systemPrompt: agent.systemPrompt,
  prompt: buildAgentPrompt(agent, mission, task),
  requiredCapabilities: task.requiredCapabilities,
  timeoutMs: 120000,
  retryPolicy: { maxRetries: task.maxRetries, backoffMs: 5000 },
  context: { missionId: mission.id, objective: mission.objective }
})

// Wait for result (or poll)
const result = await taskRunner.awaitResult(taskId, 120000)
task.result = result.output
task.status = result.status === 'completed' ? 'completed' : 'failed'
```

Key changes:
- `MissionEngine` no longer executes tasks directly — it delegates to `TaskRunnerService`
- Tasks are persisted immediately in the `tasks` table with `status='queued'`
- `TaskRunnerService` handles execution, retries, and verification
- Worker failures don't lose tasks — they're picked up by another worker

### Phase 4: API Routes for Task Management (4 hours)

Add to `apiMiddleware.ts`:

```typescript
// GET /api/tasks — list all tasks (filterable)
// GET /api/tasks/:id — get task details
// POST /api/tasks — submit a new task
// POST /api/tasks/:id/cancel — cancel a task
// POST /api/tasks/:id/retry — retry a failed task
// GET /api/tasks/stats — task statistics
// GET /api/workers — list registered workers
// POST /api/workers/register — register a new worker
```

### Phase 5: Frontend Integration (1 day)

1. **Update `MissionList.tsx`** — add task-level progress bars per mission
2. **New `TaskConsole.tsx`** — dedicated view for all tasks across all missions
3. **Update `HermesChatConsole.tsx`** — show task execution progress inline
4. **Update `useHiveData.ts`** — subscribe to task events via SSE

---

## 4. Step-by-Step Execution Order (For This Session)

Given the two active Hermes instances are already working, I'll coordinate to avoid conflicts:

### Step 1: Fix llmProvider.ts syntax errors (30 min)
- Fix the `***` redactions that broke the TypeScript

### Step 2: Create task infrastructure (2 hours)
- `src/server/persistence/taskRepository.ts`
- `src/server/persistence/hiveDatabase.ts` update (add task table)
- `src/server/tasks/taskRunner.ts` (core orchestration)
- `src/server/tasks/taskWorker.ts` (worker process)
- `src/shared/types.ts` update (add Task-related types)

### Step 3: Integrate into MissionEngine (1 hour)
- Update `missionEngine.ts` to use TaskRunnerService
- Update `apiMiddleware.ts` to wire the new service
- Add task API routes

### Step 4: Frontend updates (1 hour)
- Update `useHiveData.ts` hook
- Add task event types to Sidebar
- Simple task list component

### Step 5: Verify (30 min)
- `bun run lint` — zero errors
- `bun run build` — successful build
- Start server, create a mission, verify task executes

---

## 5. Coordination Notes

The two active Hermes instances are working on:
- **Instance 1:** Probably working on LLM provider abstraction + backend integration (based on files modified: `llmProvider.ts`, `apiMiddleware.ts`, `backendRegistry.ts`, `suprimeBridge.ts`)
- **Instance 2:** Probably working on mission engine, chat engine, and frontend components (based on files modified: `missionEngine.ts`, `chatEngine.ts`, `hermesEngine.ts`, `App.tsx`, `Sidebar.tsx`, `SettingsPanel.tsx`)

**I should avoid touching:** `apiMiddleware.ts`, `llmProvider.ts`, `missionEngine.ts`, `chatEngine.ts`, `hermesEngine.ts`, frontend components.

**Files I CAN safely create:** New files under `src/server/tasks/` and `src/server/persistence/` (new repository).

**Files I CAN safely modify:** `src/server/bus/messageBus.ts` (if adding new event types — though types.ts already has them), `src/shared/types.ts` (add Task interfaces — though this was already modified).

---

## 6. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Two instances step on each other | I'll only create new files, not modify existing ones being worked on |
| SQLite contention with high concurrency | Use WAL mode (already enabled), separate connections per worker |
| Worker process crashes | Tasks return to `queued` status; `dead_letter` table captures failures |
| LLM provider hangs | Per-task timeout (default 120s); worker kills and requeues |
| API route conflicts | New routes under `/api/tasks/*` — no conflicts with existing routes |

---

## 7. Deliverables

1. **`src/server/tasks/taskRunner.ts`** — TaskRunnerService class
2. **`src/server/tasks/taskWorker.ts`** — Standalone worker process entry point
3. **`src/server/persistence/taskRepository.ts`** — Task persistence layer
4. **`src/server/tasks/index.ts`** — Exports + singleton instance
5. **Modified `src/server/missions/missionEngine.ts`** — Delegates task execution to TaskRunnerService
6. **Modified `src/server/apiMiddleware.ts`** — New task/worker API routes + service wiring
7. **Modified `src/client/hooks/useHiveData.ts`** — Subscribe to task events
8. **New frontend components** — TaskConsole, updated MissionList

---

## 8. Testing Strategy

1. **Unit tests:** `src/test/stage10_tasks.test.ts` — Test task repository CRUD, task runner submission, retry logic
2. **Integration test:** Submit a task via API → verify it executes → check result in UI
3. **Failure simulation:** Kill worker process mid-task → verify recovery
4. **Concurrency test:** Submit 20 tasks simultaneously → verify queue ordering + parallel execution

---

## 9. Future Phases (Beyond This Session)

| Phase | Description | Timeline |
|---|---|---|
| Phase 6 | Migrate to Redis + BullMQ for true distributed queues | Future |
| Phase 7 | Dockerize worker processes for horizontal scaling | Future |
| Phase 8 | Kubernetes orchestration for multi-node deployment | Future |
| Phase 9 | MCP server integration for tool-use loop in chat engine | Future |
| Phase 10 | Real-time WebSocket streaming of agent logs to frontend | Future |
