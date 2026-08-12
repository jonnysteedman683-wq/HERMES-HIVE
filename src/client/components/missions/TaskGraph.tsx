import React, { useState } from 'react';
import { badgeFor, TASK_STATUS_BADGE } from '../../utils/badges';
import { MissionTask } from '../../../shared/types';
import { ShieldCheck, ChevronDown, ChevronRight, ArrowDown } from 'lucide-react';

interface TaskGraphProps {
  tasks: MissionTask[];
}

export const TaskGraph: React.FC<TaskGraphProps> = ({ tasks }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
        <span>LIVE TASK DEPENDENCY GRAPH ({tasks.length} TASKS)</span>
        <span className="text-cyan-400">BOUNDED CONCURRENCY QUEUE</span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => {
          const statusInfo = badgeFor(TASK_STATUS_BADGE, task.status);
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedTaskId === task.id;

          return (
            <div key={task.id} className="relative">
              {/* Dependency Connector Line */}
              {idx < tasks.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-800 z-0 flex items-center justify-center">
                  <ArrowDown className="w-3 h-3 text-cyan-500/60 -mb-2" />
                </div>
              )}

              <div
                className={`relative z-10 p-4 rounded-xl border transition-all ${
                  task.status === 'running'
                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : task.status === 'completed'
                    ? 'bg-slate-900/80 border-slate-800'
                    : task.status === 'failed'
                    ? 'bg-red-950/20 border-red-800/50'
                    : 'bg-slate-900/40 border-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${statusInfo.bg}`}
                    >
                      <StatusIcon className={`w-4 h-4 ${task.status === 'running' ? 'animate-spin' : ''}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{task.title}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                        {task.verified && (
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                        <span>Role: <strong className="text-cyan-400">{task.requiredRole}</strong></span>
                        {task.assignedAgentName && (
                          <span>Assigned Agent: <strong className="text-slate-200">{task.assignedAgentName}</strong></span>
                        )}
                        {task.dependencies.length > 0 && (
                          <span>Depends On: <strong className="text-amber-400">{task.dependencies.join(', ')}</strong></span>
                        )}
                        {task.retryCount > 0 && (
                          <span className="text-amber-400">Retries: {task.retryCount}/{task.maxRetries}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Deliverable Text */}
                  {task.result && (
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0 font-mono transition-all"
                    >
                      <span>Result</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Expanded Result Output Box */}
                {isExpanded && task.result && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      Agent Output Deliverable:
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 max-h-60 overflow-y-auto leading-relaxed">
                      {task.result}
                    </pre>
                    {task.verificationComments && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-sans">
                        <strong>Critic Verification Note:</strong> {task.verificationComments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
