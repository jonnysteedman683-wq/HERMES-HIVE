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

  private errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return (await res.json()) as SuprimeHealth;
    } catch (err) {
      console.warn(`[SuprimeBridge] health() failed: ${this.errorMessage(err)}`);
      return {
        status: 'error',
        suprime_version: '',
        started: false,
        node_id: null,
        address: null,
        tasks_submitted: 0,
        last_error: this.errorMessage(err),
      } as SuprimeHealth;
    }
  }

  async startSwarm() {
    try {
      const res = await fetch(`${this.baseUrl}/swarm/start`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      console.warn(`[SuprimeBridge] startSwarm() failed: ${this.errorMessage(err)}`);
      return { status: 'error', error: this.errorMessage(err) };
    }
  }

  async stopSwarm() {
    try {
      const res = await fetch(`${this.baseUrl}/swarm/stop`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      console.warn(`[SuprimeBridge] stopSwarm() failed: ${this.errorMessage(err)}`);
      return { status: 'error', error: this.errorMessage(err) };
    }
  }

  async status() {
    try {
      const res = await fetch(`${this.baseUrl}/swarm/status`);
      return (await res.json()) as SuprimeStatus;
    } catch (err) {
      console.warn(`[SuprimeBridge] status() failed: ${this.errorMessage(err)}`);
      return {
        status: 'error',
        started: false,
        node_id: '',
        address: '',
        leader: null,
        peers: [],
        store_keys: [],
        metrics: {},
      } as SuprimeStatus;
    }
  }

  async submitTask(kind: string, args: Record<string, unknown> = {}, taskId?: string) {
    try {
      const res = await fetch(`${this.baseUrl}/tasks/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, args, task_id: taskId }),
      });
      return await res.json();
    } catch (err) {
      console.warn(`[SuprimeBridge] submitTask(${kind}) failed: ${this.errorMessage(err)}`);
      return { status: 'error', error: this.errorMessage(err) };
    }
  }

  async listTasks() {
    try {
      const res = await fetch(`${this.baseUrl}/tasks`);
      return (await res.json()) as { status: string; tasks: SuprimeTask[] };
    } catch (err) {
      console.warn(`[SuprimeBridge] listTasks() failed: ${this.errorMessage(err)}`);
      return { status: 'error', tasks: [] } as { status: string; tasks: SuprimeTask[] };
    }
  }

  async registerWorker(kind: string) {
    try {
      const res = await fetch(`${this.baseUrl}/worker/${encodeURIComponent(kind)}`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      console.warn(`[SuprimeBridge] registerWorker(${kind}) failed: ${this.errorMessage(err)}`);
      return { status: 'error', error: this.errorMessage(err) };
    }
  }
}

export const suprimeBridge = new SuprimeBridge();
