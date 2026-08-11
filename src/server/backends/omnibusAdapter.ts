import { BackendAdapter } from './backendRegistry';

export class OmnibusBackendAdapter implements BackendAdapter {
  readonly name = 'omnibus';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      const data = await res.json();
      return { status: res.ok ? 'ok' : 'degraded', detail: data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', detail: message };
    }
  }

  async start() {
    return { status: 'unsupported' };
  }

  async stop() {
    return { status: 'unsupported' };
  }

  async status() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      const data = await res.json();
      return { status: 'ok', omnibus: data } as Record<string, unknown>;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', detail: message } as Record<string, unknown>;
    }
  }

  async submitTask(payload: { kind: string; args?: Record<string, unknown>; taskId?: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/swarm/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: payload.kind, params: payload.args || {} }),
      });
      const data = await res.json();
      return { status: res.ok ? 'submitted' : 'error', taskId: data.requestId, detail: data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', detail: message };
    }
  }

  async listTasks() {
    try {
      const res = await fetch(`${this.baseUrl}/api/swarm/status`);
      const data = await res.json();
      return { status: 'ok', tasks: Array.isArray(data.tasks) ? data.tasks : [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', tasks: [], detail: message };
    }
  }
}
