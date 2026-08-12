import React, { useState, useEffect } from 'react';
import { AGENT_STATUS_BADGE, clsFor } from '../../utils/badges';
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
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  Trash2,
  Layers
} from 'lucide-react';

interface AgentInspectorProps {
  agent: Agent | null;
  agents?: Agent[];
  selectedAgents?: Agent[];
  onClose: () => void;
  onApplyAction: (agentId: string, action: 'pause' | 'resume' | 'terminate' | 'restart') => Promise<void>;
  onApplyBulkAction?: (agentIds: string[], action: 'pause' | 'resume' | 'terminate' | 'restart') => Promise<void>;
  onSelectAgents?: (agents: Agent[]) => void;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  agents = [],
  selectedAgents = [],
  onClose,
  onApplyAction,
  onApplyBulkAction,
  onSelectAgents,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'bulk'>('single');
  const [agentId1, setAgentId1] = useState<string>('');
  const [agentId2, setAgentId2] = useState<string>('');
  const [isBulkExecuting, setIsBulkExecuting] = useState<boolean>(false);
  const [bulkStatusMessage, setBulkStatusMessage] = useState<string>('');

  // Effective selected agents list
  const effectiveSelectedAgents = selectedAgents.length > 0 
    ? selectedAgents 
    : (agent ? [agent] : []);

  // Sync state on prop changes
  useEffect(() => {
    if (selectedAgents.length > 1) {
      setViewMode('bulk');
    } else if (agent) {
      if (selectedAgents.length === 0) {
        setViewMode('single');
      }
      setAgentId1(agent.id);
      if (!agentId2 || agentId2 === agent.id) {
        const otherAgent = agents.find((a) => a.id !== agent.id);
        if (otherAgent) {
          setAgentId2(otherAgent.id);
        }
      }
    }
  }, [agent, selectedAgents, agents]);

  if (!agent && effectiveSelectedAgents.length === 0) return null;

  const activePrimaryAgent = agents.find((a) => a.id === agentId1) || effectiveSelectedAgents[0] || agent;
  const agent2 = agents.find((a) => a.id === agentId2) || agents.find((a) => a.id !== activePrimaryAgent?.id) || null;

  // Status badge renderer
  const renderStatusBadge = (status: Agent['status']) => (
    <span
      className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase font-bold ${
clsFor(AGENT_STATUS_BADGE, status)
      }`}
    >
      {status}
    </span>
  );

  // Individual Agent Controls Block
  const renderAgentControls = (targetAgent: Agent) => (
    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Controls ({targetAgent.name})</div>
      <div className="grid grid-cols-2 gap-2">
        {targetAgent.status === 'paused' ? (
          <button
            onClick={() => onApplyAction(targetAgent.id, 'resume')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        ) : (
          <button
            onClick={() => onApplyAction(targetAgent.id, 'pause')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        )}

        <button
          onClick={() => onApplyAction(targetAgent.id, 'restart')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restart
        </button>
      </div>

      <button
        onClick={() => onApplyAction(targetAgent.id, 'terminate')}
        className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-800/50 font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
      >
        <Power className="w-3.5 h-3.5" /> Terminate Agent
      </button>
    </div>
  );

  // Bulk Action Dispatcher
  const handleTriggerBulkAction = async (action: 'pause' | 'resume' | 'terminate' | 'restart') => {
    if (effectiveSelectedAgents.length === 0) return;
    setIsBulkExecuting(true);
    setBulkStatusMessage(`Applying '${action.toUpperCase()}' action to ${effectiveSelectedAgents.length} selected agents...`);

    try {
      const agentIds = effectiveSelectedAgents.map((a) => a.id);
      if (onApplyBulkAction) {
        await onApplyBulkAction(agentIds, action);
      } else {
        await Promise.all(agentIds.map((id) => onApplyAction(id, action)));
      }
      setBulkStatusMessage(`Successfully applied '${action.toUpperCase()}' to all ${effectiveSelectedAgents.length} selected agents.`);
    } catch (err: any) {
      console.error('Failed executing bulk agent action:', err);
      setBulkStatusMessage(`Bulk action '${action}' encountered errors: ${err.message || 'Network failure'}`);
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkStatusMessage(''), 5000);
    }
  };

  // Deselect single agent from multi-select list
  const handleRemoveAgentFromSelection = (agentId: string) => {
    const updated = effectiveSelectedAgents.filter((a) => a.id !== agentId);
    if (onSelectAgents) {
      onSelectAgents(updated);
    }
    if (updated.length === 0) {
      onClose();
    }
  };

  // Status breakdown calculations
  const workingCount = effectiveSelectedAgents.filter((a) => a.status === 'working').length;
  const idleCount = effectiveSelectedAgents.filter((a) => a.status === 'idle').length;
  const pausedCount = effectiveSelectedAgents.filter((a) => a.status === 'paused').length;
  const failedCount = effectiveSelectedAgents.filter((a) => a.status === 'failed' || a.status === 'terminated').length;

  // Aggregate stats calculations
  const totalCpu = effectiveSelectedAgents.reduce((acc, a) => acc + (a.resourceUsage?.cpuPct || 0), 0);
  const totalMem = effectiveSelectedAgents.reduce((acc, a) => acc + (a.resourceUsage?.memoryMb || 0), 0);
  const avgReputation = effectiveSelectedAgents.length > 0 
    ? Math.round(effectiveSelectedAgents.reduce((acc, a) => acc + (a.reputation?.score || 0), 0) / effectiveSelectedAgents.length)
    : 0;
  const totalTasks = effectiveSelectedAgents.reduce((acc, a) => acc + (a.reputation?.tasksCompleted || 0), 0);

  return (
    <div
      className={`fixed inset-y-0 right-0 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto transition-all duration-300 ${
        viewMode === 'compare' ? 'w-[880px] max-w-[95vw]' : viewMode === 'bulk' ? 'w-[600px] max-w-[95vw]' : 'w-96'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            {viewMode === 'bulk' ? (
              <Users className="w-5 h-5 text-cyan-300" />
            ) : viewMode === 'compare' ? (
              <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            ) : (
              <Zap className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {viewMode === 'bulk'
                ? `BULK AGENT INSPECTOR`
                : viewMode === 'compare'
                ? 'Agent Comparison Inspector'
                : activePrimaryAgent?.name || 'Agent Inspector'}
              {viewMode === 'bulk' && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono">
                  {effectiveSelectedAgents.length} SELECTED
                </span>
              )}
              {viewMode === 'single' && activePrimaryAgent && renderStatusBadge(activePrimaryAgent.status)}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {viewMode === 'bulk'
                ? 'Batch management, status sync, and policy actions'
                : viewMode === 'compare'
                ? 'Side-by-side performance & resource benchmarking'
                : `Role: ${activePrimaryAgent?.role} • Cluster: ${activePrimaryAgent?.clusterId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                viewMode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single
            </button>
            {agents.length > 1 && (
              <button
                onClick={() => setViewMode('compare')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                  viewMode === 'compare'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compare
              </button>
            )}
            <button
              onClick={() => setViewMode('bulk')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'bulk'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3 h-3 text-cyan-400" />
              Bulk ({effectiveSelectedAgents.length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="p-5 space-y-6 flex-1">
        {viewMode === 'bulk' ? (
          /* ================= BULK ACTIONS VIEW ================= */
          <div className="space-y-6">
            {/* Primary Bulk Controls Section */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Executive Bulk Operations
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Targeting {effectiveSelectedAgents.length} Agents
                </span>
              </div>

              {/* Status Breakdown Bar */}
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
                  <div className="text-[10px] text-cyan-400 font-bold">WORKING</div>
                  <div className="text-sm font-bold text-slate-100">{workingCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <div className="text-[10px] text-emerald-400 font-bold">IDLE</div>
                  <div className="text-sm font-bold text-slate-100">{idleCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
                  <div className="text-[10px] text-amber-400 font-bold">PAUSED</div>
                  <div className="text-sm font-bold text-slate-100">{pausedCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/40">
                  <div className="text-[10px] text-red-400 font-bold">FAILED / TERM</div>
                  <div className="text-sm font-bold text-slate-100">{failedCount}</div>
                </div>
              </div>

              {/* Bulk Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={() => handleTriggerBulkAction('pause')}
                  disabled={isBulkExecuting}
                  className="px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
                >
                  <Pause className="w-4 h-4" /> Pause All
                </button>

                <button
                  onClick={() => handleTriggerBulkAction('resume')}
                  disabled={isBulkExecuting}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Resume All
                </button>

                <button
                  onClick={() => handleTriggerBulkAction('restart')}
                  disabled={isBulkExecuting}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md border border-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" /> Restart All
                </button>

                <button
                  onClick={() => handleTriggerBulkAction('terminate')}
                  disabled={isBulkExecuting}
                  className="px-3 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Power className="w-4 h-4 text-red-400" /> Terminate All
                </button>
              </div>

              {/* Bulk Action Execution Status Notice */}
              {(isBulkExecuting || bulkStatusMessage) && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2">
                  {isBulkExecuting ? (
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className={isBulkExecuting ? 'text-cyan-300' : 'text-emerald-300'}>
                    {bulkStatusMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Selection Helpers Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Quick Presets:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onSelectAgents && onSelectAgents([...agents])}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/40 text-[11px] font-semibold"
                >
                  Select All Swarm ({agents.length})
                </button>
                <button
                  onClick={() => onSelectAgents && onSelectAgents(agents.filter((a) => a.status === 'paused'))}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-800/40 text-[11px] font-semibold"
                >
                  Select Paused Only
                </button>
                <button
                  onClick={() => onSelectAgents && onSelectAgents(agents.filter((a) => a.status === 'working'))}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/40 text-[11px] font-semibold"
                >
                  Select Working Only
                </button>
              </div>
            </div>

            {/* Selected Agents Cards List */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Selected Swarm Agents ({effectiveSelectedAgents.length})</span>
                {effectiveSelectedAgents.length > 0 && (
                  <button
                    onClick={() => onSelectAgents && onSelectAgents([])}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                )}
              </h3>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {effectiveSelectedAgents.map((targetAgent) => (
                  <div
                    key={targetAgent.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 border border-slate-800">
                        {targetAgent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          {targetAgent.name}
                          {renderStatusBadge(targetAgent.status)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {targetAgent.role} • {targetAgent.clusterId} • Reputation: {targetAgent.reputation.score}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {targetAgent.status === 'paused' ? (
                        <button
                          onClick={() => onApplyAction(targetAgent.id, 'resume')}
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Resume agent"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onApplyAction(targetAgent.id, 'pause')}
                          className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/50 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Pause agent"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveAgentFromSelection(targetAgent.id)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Remove from selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aggregate Resource Load & Reputation Metrics */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-slate-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" /> Aggregate Load & Benchmark Stats
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total CPU</div>
                  <div className="text-slate-200 font-bold text-sm">{totalCpu}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total Memory</div>
                  <div className="text-slate-200 font-bold text-sm">{totalMem} MB</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Avg Reputation</div>
                  <div className="text-emerald-400 font-bold text-sm">{avgReputation}/100</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total Tasks</div>
                  <div className="text-cyan-400 font-bold text-sm">{totalTasks}</div>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'compare' && agent2 ? (
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
                    value={activePrimaryAgent.id}
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
                      <option key={a.id} value={a.id} disabled={a.id === activePrimaryAgent.id}>
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
                  {activePrimaryAgent.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Role: <span className="text-cyan-300 font-semibold">{activePrimaryAgent.role}</span> • {activePrimaryAgent.clusterId}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {renderStatusBadge(activePrimaryAgent.status)}
                  <span className="text-xs text-slate-400 font-mono">
                    Health: <span className="text-emerald-400 font-semibold">{activePrimaryAgent.health}</span>
                  </span>
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
                  <span className="text-xs text-slate-400 font-mono">
                    Health: <span className="text-emerald-400 font-semibold">{agent2.health}</span>
                  </span>
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
                    <span className="text-cyan-400 font-semibold">{activePrimaryAgent.name}: {activePrimaryAgent.reputation.score}</span>
                    <span className="text-slate-400 text-[11px]">Overall Reputation Score</span>
                    <span className="text-emerald-400 font-semibold">{agent2.name}: {agent2.reputation.score}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all" style={{ width: `${activePrimaryAgent.reputation.score}%` }} />
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
                      {Math.round(activePrimaryAgent.reputation.successRate * 100)}%
                      {activePrimaryAgent.reputation.successRate > agent2.reputation.successRate && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">+ higher</span>
                      )}
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Success Rate</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300 flex items-center justify-end gap-1.5">
                      {agent2.reputation.successRate > activePrimaryAgent.reputation.successRate && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">+ higher</span>
                      )}
                      {Math.round(agent2.reputation.successRate * 100)}%
                    </div>
                  </div>

                  {/* Avg Latency */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300 flex items-center gap-1.5">
                      {activePrimaryAgent.reputation.averageLatencyMs} ms
                      {activePrimaryAgent.reputation.averageLatencyMs < agent2.reputation.averageLatencyMs && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">faster</span>
                      )}
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Avg Latency</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300 flex items-center justify-end gap-1.5">
                      {agent2.reputation.averageLatencyMs < activePrimaryAgent.reputation.averageLatencyMs && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 rounded">faster</span>
                      )}
                      {agent2.reputation.averageLatencyMs} ms
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="py-2.5 grid grid-cols-3 items-center font-mono">
                    <div className="text-slate-200 font-semibold text-cyan-300">
                      {activePrimaryAgent.reputation.tasksCompleted} tasks
                    </div>
                    <div className="text-center text-slate-400 text-[11px]">Tasks Completed</div>
                    <div className="text-right text-slate-200 font-semibold text-emerald-300">
                      {agent2.reputation.tasksCompleted} tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side Controls */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              {renderAgentControls(activePrimaryAgent)}
              {renderAgentControls(agent2)}
            </div>
          </div>
        ) : (
          /* ================= SINGLE AGENT VIEW ================= */
          activePrimaryAgent && (
            <>
              {/* Capabilities */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Capabilities
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activePrimaryAgent.capabilities.map((cap) => (
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
                    <span className="font-mono font-bold text-emerald-400 text-sm">{activePrimaryAgent.reputation.score} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all" style={{ width: `${activePrimaryAgent.reputation.score}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <div className="text-slate-500 text-[10px]">Success Rate</div>
                      <div className="text-slate-200 font-semibold">{Math.round(activePrimaryAgent.reputation.successRate * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Avg Latency</div>
                      <div className="text-slate-200 font-semibold">{activePrimaryAgent.reputation.averageLatencyMs} ms</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Tasks Done</div>
                      <div className="text-slate-200 font-semibold">{activePrimaryAgent.reputation.tasksCompleted}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Verification</div>
                      <div className="text-slate-200 font-semibold">{Math.round(activePrimaryAgent.reputation.verificationRate * 100)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" /> Real-time Resources
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" /> CPU Allocation
                    </div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">{activePrimaryAgent.resourceUsage.cpuPct}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-400" /> Memory Usage
                    </div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">{activePrimaryAgent.resourceUsage.memoryMb} MB</div>
                  </div>
                </div>
              </div>

              {/* Current Task */}
              {activePrimaryAgent.currentTaskId && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs">
                  <div className="text-cyan-400 font-mono font-bold mb-1">Active Assigned Task</div>
                  <div className="text-slate-300 font-sans">{activePrimaryAgent.currentTaskId}</div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Control Buttons (Rendered at bottom for single view) */}
      {viewMode === 'single' && activePrimaryAgent && (
        <div className="p-5 border-t border-slate-800 bg-slate-900/60">
          {renderAgentControls(activePrimaryAgent)}
        </div>
      )}
    </div>
  );
};
