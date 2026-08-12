import React, { useState } from 'react';
import { badgeFor, SEVERITY_BADGE } from '../../utils/badges';
import { formatTime } from '../../utils/format';
import { HiveEvent } from '../../../shared/types';
import { Activity, Search } from 'lucide-react';

interface EventStreamProps {
  events: HiveEvent[];
}

export const EventStream: React.FC<EventStreamProps> = ({ events }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((evt) => {
    if (severityFilter !== 'all' && evt.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.type.toLowerCase().includes(q) ||
        evt.source.toLowerCase().includes(q) ||
        JSON.stringify(evt.payload).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              REAL-TIME HIVE EVENT STREAM
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono">
                {filteredEvents.length} Events
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency Server-Sent Event (SSE) message bus stream tracking task assignments, heartbeats, and recovery events.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events payload or source..."
            className="w-full bg-slate-900 text-xs text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl min-h-0">
        {/* Severity Filters */}
        <div className="flex items-center gap-2 mb-4 font-mono text-xs border-b border-slate-800 pb-3">
          <span className="text-slate-500 mr-2">Severity:</span>
          {['all', 'info', 'success', 'warning', 'error'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg uppercase font-bold text-[11px] transition-all ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Events Table / List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
          {filteredEvents.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-8 text-center border border-dashed border-slate-800 rounded-xl">
              No events found.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const badge = badgeFor(SEVERITY_BADGE, evt.severity);
              const Icon = badge.icon;

              return (
                <div key={evt.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] rounded border ${badge.bg} flex items-center gap-1 font-bold`}>
                        <Icon className="w-3 h-3" /> {badge.label}
                      </span>
                      <span className="text-slate-100 font-bold">{evt.type}</span>
                      <span className="text-slate-500 text-[11px]">from {evt.source}</span>
                    </div>

                    <span className="text-[10px] text-slate-500">
                      {formatTime(evt.timestamp)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-slate-300 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(evt.payload, null, 2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
