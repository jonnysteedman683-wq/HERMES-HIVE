export interface SuprimeHealth {
  status: string;
  suprime_version: string;
  started: boolean;
  node_id: string | null;
  address: string | null;
  tasks_submitted: number;
  last_error: string | null;
}

export interface SuprimeTask {
  id: string;
  kind: string;
  state: string;
  owner: string | null;
  result: unknown;
  error: string | null;
}

export interface SuprimeStatus {
  status: string;
  started: boolean;
  node_id: string;
  address: string;
  leader: string | null;
  peers: string[];
  store_keys: string[];
  metrics: Record<string, number>;
}

const SUPRIME_BRIDGE_URL = process.env.SUPRIME_BRIDGE_URL || 'http://localhost:8123';

export class SuprimeBridge {
  readonly name = 'suprime';
  private baseUrl: string;

  constructor(baseUrl = SUPRIME_BRIDGE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async health() {
    const res = await fetch(`${this.baseUrl}/health`);
    return (await res.json()) as SuprimeHealth;
  }

  async startSwarm() {
    const res = await fetch(`${this.baseUrl}/swarm/start`, { method: 'POST' });
    return await res.json();
  }

  async stopSwarm() {
    const res = await fetch(`${this.baseUrl}/swarm/stop`, { method: 'POST' });
    return await res.json();
  }

  async status() {
    const res = await fetch(`${this.baseUrl}/swarm/status`);
    return (await res.json()) as SuprimeStatus;
  }

  async submitTask(kind: string, args: Record<string, unknown> = {}, taskId?: string) {
    const res = await fetch(`${this.baseUrl}/tasks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, args, task_id: taskId }),
    });
    return await res.json();
  }

  async listTasks() {
    const res = await fetch(`${this.baseUrl}/tasks`);
    return (await res.json()) as { status: string; tasks: SuprimeTask[] };
  }

  async registerWorker(kind: string) {
    const res = await fetch(`${this.baseUrl}/worker/${encodeURIComponent(kind)}`, { method: 'POST' });
    return await res.json();
  }
}

export const suprimeBridge = new SuprimeBridge();
