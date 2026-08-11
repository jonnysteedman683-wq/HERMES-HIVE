import React, { useState, useEffect } from 'react';
import { Agent } from '../../../shared/types';
import {
  X,
  Play,
  Pause,
  Power,
  RotateCcw,
  ShieldCheck,
  Cpu,
  HardDrive,
  Award,
  ArrowLeftRight,
  ChevronDown,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface AgentInspectorProps {
  agent: Agent | null;
  agents?: Agent[];
  onClose: () => void;
  onApplyAction: (agentId: string, action: 'pause' | 'resume' | 'terminate' | 'restart') => Promise<void>;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  agents = [],
  onClose,
  onApplyAction,
}) => {
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [agentId1, setAgentId1] = useState<string>('');
  const [agentId2, setAgentId2] = useState<string>('');

  // Sync selected agent
  useEffect(() => {
    if (agent) {
      setAgentId1(agent.id);
      if (!agentId2 || agentId2 === agent.id) {
        const otherAgent = agents.find((a) => a.id !== agent.id);
        if (otherAgent) {
          setAgentId2(otherAgent.id);
        }
      }
    }
  }, [agent, agents]);

  if (!agent) return null;

  const agent1 = agents.find((a) => a.id === agentId1) || agent;
  const agent2 = agents.find((a) => a.id === agentId2) || agents.find((a) => a.id !== agent1.id) || null;

  // Helper for status badge
  const renderStatusBadge = (status: Agent['status']) => (
    <span
      className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase font-bold ${
        status === 'working'
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          : status === 'idle'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : status === 'paused'
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-red-500/20 text-red-300 border border-red-500/40'
      }`}
    >
      {status}
    </span>
  );

  // Single Agent Controls Block
  const renderAgentControls = (targetAgent: Agent) => (
    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Controls ({targetAgent.name})</div>
      <div className="grid grid-cols-2 gap-2">
        {targetAgent.status === 'paused' ? (
          <button
            onClick={() => onApplyAction(targetAgent.id, 'resume')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        ) : (
          <button
            onClick={() => onApplyAction(targetAgent.id, 'pause')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        )}

        <button
          onClick={() => onApplyAction(targetAgent.id, 'restart')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restart
        </button>
      </div>

      <button
        onClick={() => onApplyAction(targetAgent.id, 'terminate')}
        className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-800/50 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
      >
        <Power className="w-3.5 h-3.5" /> Terminate Agent
      </button>
    </div>
  );

  return (
    <div
      className={`fixed inset-y-0 right-0 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto transition-all duration-300 ${
        isCompareMode ? 'w-[880px] max-w-[95vw]' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {isCompareMode ? 'Agent Comparison Inspector' : agent1.name}
              {!isCompareMode && renderStatusBadge(agent1.status)}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isCompareMode
                ? 'Side-by-side performance & resource benchmarking'
                : `Role: ${agent1.role} • Cluster: ${agent1.clusterId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher Toggle */}
          {agents.length > 1 && (
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                isCompareMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              {isCompareMode ? 'Single View' : 'Compare Mode'}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-6 flex-1">
        {isCompareMode && agent2 ? (
          /* ================= COMPARE MODE VIEW ================= */
          <div className="space-y-6">
            {/* Selectors Bar */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              {/* Agent 1 Selector */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 font-semibold mb-1.5 uppercase tracking-wider">
                  Primary Agent
                </label>
                <div className="relative">
                  <select
                    value={agent1.id}
                    onChange={(e) => setAgentId1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === agent2.id}>
                        {a.name} ({a.role} • {a.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Agent 2 Selector */}
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 font-semibold mb-1.5 uppercase tracking-wider">
                  Comparative Agent
                </label>
                <div className="relative">
                  <select
                    value={agent2.id}
                    onChange={(e) => setAgentId2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === agent1.id}>
                        {a.name} ({a.role} • {a.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Agent 1 Card Header */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-800/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/10 text-cyan-400 border-b border-l border-cyan-500/30 text-[10px] font-mono font-bold rounded-bl-lg">
                  AGENT A
                </div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {agent1.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Role: <span className="text-cyan-300 font-semibold">{agent1.role}</span> • {agent1.clusterId}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {renderStatusBadge(agent1.status)}
                  <span className="text-xs text-slate-400 font-mono">Health: <span className="text-emerald-400 font-semibold">{agent1.health}</span></span>
                </div>
              </div>

              {/* Agent 2 Card Header */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-800/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 text-emerald-400 border-b border-l border-emerald-500/30 text-[10px] font-mono font-bold rounded-bl-lg">
                  AGENT B
                </div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {agent2.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Role: <span className="text-emerald-300 font-semibold">{agent2.role}</span> • {agent2.clusterId}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {renderStatusBadge(agent2.status)}
                  <span className="text-xs text-slate-400 font-mono">Health: <span className="text-emerald-400 font-semibold">{agent2.health}</span></span>
                </div>
              </div>
            </div>

            {/* Reputation & Performance Metrics Comparison */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Reputation & Performance Benchmark
              </h3>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                {/* Reputation Score Progress Bars */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-cyan-400 font-semibold">{agent1.name}: {agent1.reputation.score}</span>
                    <span className="text-slate-400 text-[11px]">Overall Reputation Score</span>
                    <span className="text-emerald-400 font-semibold">{agent2.name}: {agent2.reputation.score}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all" style={{ width: `${agent1.reputation.score}%` }} />
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${agent2.reputation.score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Metrics Matrix Table */}
                <div className="divide-y divide-slate-800/80 text-xs">
                  {/* Success Rate */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300 flex items-center gap-1.5">
                      {Math.round(agent1.reputation.successRate * 100)}%
                      {agent1.reputation.successRate > agent2.reputation.successRate && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">+ higher</span>
                      )}
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Success Rate</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300 flex items-center justify-end gap-1.5">
                      {agent2.reputation.successRate > agent1.reputation.successRate && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">+ higher</span>
                      )}
                      {Math.round(agent2.reputation.successRate * 100)}%
                    </div>
                  </div>

                  {/* Avg Latency */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300 flex items-center gap-1.5">
                      {agent1.reputation.averageLatencyMs} ms
                      {agent1.reputation.averageLatencyMs < agent2.reputation.averageLatencyMs && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">faster</span>
                      )}
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Avg Latency</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300 flex items-center justify-end gap-1.5">
                      {agent2.reputation.averageLatencyMs < agent1.reputation.averageLatencyMs && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">faster</span>
                      )}
                      {agent2.reputation.averageLatencyMs} ms
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300">
                      {agent1.reputation.tasksCompleted} tasks
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Tasks Completed</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300">
                      {agent2.reputation.tasksCompleted} tasks
                    </div>
                  </div>

                  {/* Verification Rate */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300">
                      {Math.round(agent1.reputation.verificationRate * 100)}%
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Verification Rate</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300">
                      {Math.round(agent2.reputation.verificationRate * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Resource Comparison */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" /> Real-time Resource Load
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Agent 1 Resources */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-cyan-400 font-mono">{agent1.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">CPU Usage</div>
                      <div className="text-slate-200 font-bold">{agent1.resourceUsage.cpuPct}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Memory</div>
                      <div className="text-slate-200 font-bold">{agent1.resourceUsage.memoryMb} MB</div>
                    </div>
                  </div>
                </div>

                {/* Agent 2 Resources */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 font-mono">{agent2.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">CPU Usage</div>
                      <div className="text-slate-200 font-bold">{agent2.resourceUsage.cpuPct}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Memory</div>
                      <div className="text-slate-200 font-bold">{agent2.resourceUsage.memoryMb} MB</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities Comparison */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Capabilities Matrix
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold mb-2 uppercase">{agent1.name} Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {agent1.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-2 uppercase">{agent2.name} Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {agent2.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side Actions */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              {renderAgentControls(agent1)}
              {renderAgentControls(agent2)}
            </div>
          </div>
        ) : (
          /* ================= SINGLE AGENT VIEW ================= */
          <>
            {/* Capabilities */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Capabilities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {agent1.capabilities.map((cap) => (
                  <span key={cap} className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 text-xs font-mono">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Reputation Metrics */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Reputation & Performance
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reputation Score</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{agent1.reputation.score} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all" style={{ width: `${agent1.reputation.score}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="text-slate-500 font-mono text-[10px]">Success Rate</div>
                    <div className="font-mono text-slate-200 font-semibold">{Math.round(agent1.reputation.successRate * 100)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-mono text-[10px]">Avg Latency</div>
                    <div className="font-mono text-slate-200 font-semibold">{agent1.reputation.averageLatencyMs} ms</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-mono text-[10px]">Tasks Done</div>
                    <div className="font-mono text-slate-200 font-semibold">{agent1.reputation.tasksCompleted}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-mono text-[10px]">Verification</div>
                    <div className="font-mono text-slate-200 font-semibold">{Math.round(agent1.reputation.verificationRate * 100)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" /> Real-time Resources
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" /> CPU Allocation
                  </div>
                  <div className="font-mono text-slate-200 font-bold text-sm mt-0.5">{agent1.resourceUsage.cpuPct}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-emerald-400" /> Memory Usage
                  </div>
                  <div className="font-mono text-slate-200 font-bold text-sm mt-0.5">{agent1.resourceUsage.memoryMb} MB</div>
                </div>
              </div>
            </div>

            {/* Current Task */}
            {agent1.currentTaskId && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs">
                <div className="text-cyan-400 font-mono font-bold mb-1">Active Assigned Task</div>
                <div className="text-slate-300 font-sans">{agent1.currentTaskId}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Buttons (Only rendered at bottom for single view) */}
      {!isCompareMode && (
        <div className="p-5 border-t border-slate-800 bg-slate-900/60">
          {renderAgentControls(agent1)}
        </div>
      )}
    </div>
  );
};

