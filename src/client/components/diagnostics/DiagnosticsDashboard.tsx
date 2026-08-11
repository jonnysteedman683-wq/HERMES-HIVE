import React from 'react';
import { DiagnosticsMetrics } from '../../../shared/types';
import { BarChart3, Activity, Zap, Cpu, Award, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { DeepDiagnosticsConsole } from './DeepDiagnosticsConsole';

interface DiagnosticsDashboardProps {
  metrics: DiagnosticsMetrics | null;
  onRefresh: () => void;
}

export const DiagnosticsDashboard: React.FC<DiagnosticsDashboardProps> = ({ metrics, onRefresh }) => {
  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-1">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              DIAGNOSTICS & OBSERVABILITY DASHBOARD
            </h2>
            <p className="text-xs text-slate-400">
              Real-time telemetry, AI API token metrics, task duration averages, message throughput, and self-healing recovery history.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-mono font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-lg space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Hive Overall Health</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {metrics?.hiveHealthPct || 98}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-lg space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>AI Average Latency</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {metrics?.avgAiLatencyMs || 320} <span className="text-xs font-normal text-slate-500">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-lg space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Tokens Consumed</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {metrics?.totalTokensUsed || 14200}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-lg space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Self-Healing Recoveries</span>
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {metrics?.recoveryCount || 0} <span className="text-xs font-normal text-slate-500">Events</span>
          </div>
        </div>
      </div>

      {/* System Status Table */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" /> Subsystem Diagnostic Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-cyan-300">Swarm Agents Distribution</div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between"><span>Active Working Agents:</span> <strong className="text-cyan-400">{metrics?.activeAgentsCount || 0}</strong></div>
              <div className="flex justify-between"><span>Idle Ready Agents:</span> <strong className="text-emerald-400">{metrics?.idleAgentsCount || 0}</strong></div>
              <div className="flex justify-between"><span>Failed / Unresponsive:</span> <strong className="text-red-400">{metrics?.failedAgentsCount || 0}</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-cyan-300">Bus & Memory Telemetry</div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between"><span>Throughput:</span> <strong className="text-slate-100">{metrics?.messageThroughputPerMin || 120} msgs/min</strong></div>
              <div className="flex justify-between"><span>Shared Memory Records:</span> <strong className="text-slate-100">{metrics?.memoryRecordsCount || 0}</strong></div>
              <div className="flex justify-between"><span>System Uptime:</span> <strong className="text-emerald-400">{metrics?.uptimeSeconds || 120} seconds</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage 8.5 Deep Diagnostics & Self Repair Console */}
      <DeepDiagnosticsConsole />
    </div>
  );
};
