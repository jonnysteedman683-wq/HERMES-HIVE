export interface BackendAdapter {
  name: string;
  health(): Promise<{ status: string; detail?: string }>;
  start?(): Promise<{ status: string }>;
  stop?(): Promise<{ status: string }>;
  status?(): Promise<unknown>;
  submitTask?(payload: { kind: string; args?: Record<string, unknown>; taskId?: string }): Promise<{ status: string; taskId?: string }>;
  listTasks?(): Promise<{ status: string; tasks: unknown[] }>;
  registerWorker?(kind: string): Promise<{ status: string }>;
}

export interface BackendRegistration {
  name: string;
  adapter: BackendAdapter;
}

export class BackendRegistry {
  private backends: Map<string, BackendRegistration> = new Map();

  register(registration: BackendRegistration) {
    this.backends.set(registration.name, registration);
  }

  get(name: string): BackendAdapter | undefined {
    return this.backends.get(name)?.adapter;
  }

  list() {
    return Array.from(this.backends.values()).map((r) => r.name);
  }
}

export const backendRegistry = new BackendRegistry();
