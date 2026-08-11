import React, { useEffect, useMemo, useState } from 'react';

interface SuprimeTask {
  id: string;
  kind: string;
  state: string;
  owner: string | null;
  result: unknown;
  error: string | null;
}

interface SuprimeStatus {
  status: string;
  started: boolean;
  node_id: string;
  address: string;
  leader: string | null;
  peers: string[];
  store_keys: string[];
  metrics: Record<string, number>;
}

export const SuprimeSwarmView: React.FC = () => {
  const [status, setStatus] = useState<SuprimeStatus | null>(null);
  const [tasks, setTasks] = useState<SuprimeTask[]>([]);
  const [kind, setKind] = useState('hive_demo');
  const [taskText, setTaskText] = useState('hello from hive');
  const [submitting, setSubmitting] = useState(false);
  const [workerKind, setWorkerKind] = useState('hive_demo');
  const [registering, setRegistering] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(async () => {
    try {
      const [statusRes, tasksRes] = await Promise.all([
        fetch('/api/suprime/status').then((r) => r.json()).catch(() => ({})),
        fetch('/api/suprime/tasks').then((r) => r.json()).catch(() => ({ tasks: [] })),
      ]);
      if (statusRes.status === 'started' || statusRes.node_id) setStatus(statusRes);
      if (Array.isArray(tasksRes.tasks)) setTasks(tasksRes.tasks);
    } catch (err) {
      console.error('[SuprimeSwarmView] load error', err);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [load]);

  const submitTask = async () => {
    setSubmitting(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch('/api/suprime/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, args: { text: taskText } }),
      });
      const data = await res.json();
      setLastResult(JSON.stringify(data, null, 2));
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const registerWorker = async () => {
    setRegistering(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch(`/api/suprime/worker/${encodeURIComponent(workerKind)}`, {
        method: 'POST',
      });
      const data = await res.json();
      setLastResult(JSON.stringify(data, null, 2));
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide">SUPRIME SWARM BACKEND</h2>
          <p className="text-[11px] text-slate-400">
            Real decentralized swarm control plane. Status refreshes every 2s.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${status?.started ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
          />
          <span className="text-slate-300">{status?.started ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
            <h3 className="text-xs font-bold text-slate-200 mb-3">SWARM STATUS</h3>
            {!status ? (
              <p className="text-xs text-slate-400">Loading swarm state...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono">
                <div>
                  <div className="text-slate-500">NODE ID</div>
                  <div className="text-cyan-300 break-all">{status.node_id}</div>
                </div>
                <div>
                  <div className="text-slate-500">ADDRESS</div>
                  <div className="text-cyan-300 break-all">{status.address}</div>
                </div>
                <div>
                  <div className="text-slate-500">LEADER</div>
                  <div className="text-emerald-300 break-all">{status.leader || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500">PEERS</div>
                  <div className="text-slate-200">{status.peers.length > 0 ? status.peers.join(', ') : 'No peers'}</div>
                </div>
                <div>
                  <div className="text-slate-500">STORE KEYS</div>
                  <div className="text-slate-200">{status.store_keys.length}</div>
                </div>
                <div>
                  <div className="text-slate-500">TASKS SUBMITTED</div>
                  <div className="text-slate-200">{status.metrics.ticks ?? '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500">METRICS</div>
                  <div className="text-slate-200">
                    {Object.keys(status.metrics).length
                      ? Object.entries(status.metrics)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(' · ')
                      : 'No metrics yet'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
            <h3 className="text-xs font-bold text-slate-200 mb-3">TASKS</h3>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400">No tasks yet. Submit one from the panel on the right.</p>
            ) : (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 pr-3">ID</th>
                      <th className="pb-2 pr-3">KIND</th>
                      <th className="pb-2 pr-3">STATE</th>
                      <th className="pb-2 pr-3">OWNER</th>
                      <th className="pb-2">ERROR</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-t border-slate-800/70">
                        <td className="py-1.5 pr-3 break-all">{task.id}</td>
                        <td className="py-1.5 pr-3">{task.kind}</td>
                        <td className="py-1.5 pr-3">{task.state}</td>
                        <td className="py-1.5 pr-3">{task.owner || '—'}</td>
                        <td className="py-1.5 text-red-300">{task.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
            <h3 className="text-xs font-bold text-slate-200 mb-3">SUBMIT TASK</h3>
            <div className="flex flex-col gap-2 text-[11px]">
              <label className="text-slate-400">Kind</label>
              <input
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-slate-200"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              />
              <label className="text-slate-400">Text payload</label>
              <textarea
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-slate-200"
                rows={3}
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
              <button
                onClick={submitTask}
                disabled={submitting}
                className="mt-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-3 py-2 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit to swarm'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
            <h3 className="text-xs font-bold text-slate-200 mb-3">REGISTER WORKER</h3>
            <div className="flex flex-col gap-2 text-[11px]">
              <label className="text-slate-400">Worker kind</label>
              <input
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-slate-200"
                value={workerKind}
                onChange={(e) => setWorkerKind(e.target.value)}
              />
              <button
                onClick={registerWorker}
                disabled={registering}
                className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-2 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
              >
                {registering ? 'Registering...' : 'Register worker'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-[11px] font-mono text-red-300">
              {error}
            </div>
          )}
          {lastResult && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
