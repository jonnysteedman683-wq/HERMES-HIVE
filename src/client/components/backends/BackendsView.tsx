import React, { useEffect, useState } from 'react';

interface BackendHealth {
  status: string;
  detail?: string;
}

interface BackendState {
  backend: string;
  health: BackendHealth;
}

export const BackendsView: React.FC = () => {
  const [backends, setBackends] = useState<string[]>([]);
  const [states, setStates] = useState<Record<string, BackendState>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const listRes = await fetch('/api/backends').then((r) => r.json()).catch(() => ({ backends: [] }));
      const backendList: string[] = Array.isArray(listRes.backends) ? listRes.backends : [];
      setBackends(backendList);

      const statePromises = backendList.map(async (name) => {
        const res = await fetch(`/api/backends/${encodeURIComponent(name)}`).then((r) => r.json()).catch(() => ({ backend: name, health: { status: 'error', detail: 'fetch failed' } }));
        return { name, state: res as BackendState };
      });

      const results = await Promise.all(statePromises);
      const map: Record<string, BackendState> = {};
      for (const item of results) {
        map[item.name] = item.state;
      }
      setStates(map);
    } catch {
      setBackends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'ok') return 'bg-emerald-400';
    if (status === 'error') return 'bg-red-400';
    return 'bg-amber-400';
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide">BACKEND REGISTRY</h2>
          <p className="text-[11px] text-slate-400">Unified swarm backends reachable through Hermes Hive.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-slate-300">{loading ? 'REFRESHING' : 'LIVE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backends.map((name) => {
          const state = states[name];
          const health = state?.health || { status: 'unknown' };
          return (
            <div key={name} className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Adapter-backed backend</p>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor(health.status)}`} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <div className="text-slate-500">STATUS</div>
                  <div className="text-slate-200">{health.status}</div>
                </div>
                <div>
                  <div className="text-slate-500">DETAIL</div>
                  <div className="text-slate-200 break-all">{health.detail || '—'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
