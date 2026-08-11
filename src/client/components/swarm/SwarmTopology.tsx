import React, { useState } from 'react';
import { Agent } from '../../../shared/types';
import { 
  Bot, 
  Shield, 
  Cpu, 
  Activity, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  XCircle, 
  CheckSquare, 
  Square, 
  Layers, 
  Check, 
  X 
} from 'lucide-react';

interface SwarmTopologyProps {
  agents: Agent[];
  selectedAgents?: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onSelectAgents?: (agents: Agent[]) => void;
}

export const SwarmTopology: React.FC<SwarmTopologyProps> = ({ 
  agents, 
  selectedAgents = [], 
  onSelectAgent,
  onSelectAgents 
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);

  // Selected Agent IDs array
  const selectedAgentIds = selectedAgents.map((a) => a.id);

  // Group agents by cluster
  const clusterA = agents.filter((a) => a.clusterId === 'Cluster A' || !a.clusterId);
  const clusterB = agents.filter((a) => a.clusterId === 'Cluster B');
  const clusterC = agents.filter((a) => a.clusterId === 'Cluster C');

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'working':
        return { bg: 'bg-cyan-500', stroke: '#06b6d4', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]' };
      case 'idle':
        return { bg: 'bg-emerald-500', stroke: '#10b981', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' };
      case 'paused':
        return { bg: 'bg-amber-500', stroke: '#f59e0b', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' };
      case 'failed':
        return { bg: 'bg-red-500', stroke: '#ef4444', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' };
      default:
        return { bg: 'bg-slate-500', stroke: '#64748b', glow: '' };
    }
  };

  const renderStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'working':
        return <Activity className="w-3 h-3 text-cyan-300 animate-spin" />;
      case 'idle':
        return <CheckCircle2 className="w-3 h-3 text-emerald-300" />;
      case 'paused':
        return <PauseCircle className="w-3 h-3 text-amber-300" />;
      case 'failed':
        return <AlertTriangle className="w-3 h-3 text-red-300 animate-bounce" />;
      case 'terminated':
        return <XCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const handleAgentClick = (agent: Agent, event: React.MouseEvent) => {
    const isMultiKey = event.shiftKey || event.ctrlKey || event.metaKey || isMultiSelectMode;

    if (isMultiKey) {
      setIsMultiSelectMode(true);
      const exists = selectedAgentIds.includes(agent.id);
      let updated: Agent[];
      if (exists) {
        updated = selectedAgents.filter((a) => a.id !== agent.id);
      } else {
        updated = [...selectedAgents, agent];
      }
      if (onSelectAgents) {
        onSelectAgents(updated);
      }
      if (updated.length > 0) {
        onSelectAgent(updated[updated.length - 1]);
      }
    } else {
      if (onSelectAgents) {
        onSelectAgents([agent]);
      }
      onSelectAgent(agent);
    }
  };

  const handleSelectAll = () => {
    setIsMultiSelectMode(true);
    if (onSelectAgents) {
      onSelectAgents([...agents]);
    }
    if (agents.length > 0) {
      onSelectAgent(agents[0]);
    }
  };

  const handleSelectCluster = (clusterName: string) => {
    setIsMultiSelectMode(true);
    const clusterAgents = agents.filter((a) => a.clusterId === clusterName || (clusterName === 'Cluster A' && !a.clusterId));
    if (onSelectAgents) {
      onSelectAgents(clusterAgents);
    }
    if (clusterAgents.length > 0) {
      onSelectAgent(clusterAgents[0]);
    }
  };

  const handleClearSelection = () => {
    setIsMultiSelectMode(false);
    if (onSelectAgents) {
      onSelectAgents([]);
    }
  };

  return (
    <div className="relative w-full h-[540px] bg-slate-950/90 rounded-2xl border border-slate-800/80 p-6 overflow-hidden flex flex-col justify-between shadow-2xl">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* Topology Header & Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              LIVING SWARM TOPOLOGY
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono">
                {agents.length} AGENTS ACTIVE
              </span>
              {selectedAgentIds.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono font-bold flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3 text-emerald-400" />
                  {selectedAgentIds.length} SELECTED FOR BULK ACTION
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Dynamic multi-agent cluster hierarchy. Click nodes or use multi-select mode for bulk management.
            </p>
          </div>
        </div>

        {/* Multi-Select Action Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              isMultiSelectMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle multi-agent selection mode"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            {isMultiSelectMode ? 'Multi-Select Active' : 'Multi-Select Mode'}
          </button>

          <button
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-semibold transition-all flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            Select All
          </button>

          {selectedAgentIds.length > 0 && (
            <button
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-mono font-semibold transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear ({selectedAgentIds.length})
            </button>
          )}

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-2.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Working</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Idle</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Paused</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas for Links & Particle Animations */}
      <div className="relative flex-1 w-full flex items-center justify-center py-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="gradient-link" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Command Bus Link Lines */}
          <line x1="50%" y1="18%" x2="20%" y2="50%" stroke="url(#gradient-link)" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="50%" y1="18%" x2="50%" y2="50%" stroke="url(#gradient-link)" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="50%" y1="18%" x2="80%" y2="50%" stroke="url(#gradient-link)" strokeWidth="2" strokeDasharray="6 4" />

          {/* Particle pulse animations */}
          <circle r="3" fill="#06b6d4" filter="url(#glow)">
            <animateMotion path="M 500,80 L 200,240" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#3b82f6" filter="url(#glow)">
            <animateMotion path="M 500,80 L 500,240" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#10b981" filter="url(#glow)">
            <animateMotion path="M 500,80 L 800,240" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Nodes Layer */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between items-center">
          {/* Top Node: Hermes Executive Intelligence */}
          <div className="flex flex-col items-center">
            <div className="group relative cursor-pointer flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border-2 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-105 transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 border border-cyan-400/40">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black text-cyan-200 tracking-wider flex items-center gap-1.5">
                  HERMES EXECUTIVE
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Swarm Executive Intelligence</div>
              </div>
            </div>
          </div>

          {/* Middle Row: Clusters A, B, C */}
          <div className="w-full grid grid-cols-3 gap-6 px-4">
            {/* Cluster A */}
            <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-cyan-400 font-mono flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> CLUSTER A
                </div>
                <button
                  onClick={() => handleSelectCluster('Cluster A')}
                  className="text-[9px] font-mono text-cyan-400 hover:underline uppercase"
                >
                  Select Cluster
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {clusterA.map((agent) => {
                  const colors = getStatusColor(agent.status);
                  const isSelected = selectedAgentIds.includes(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={(e) => handleAgentClick(agent, e)}
                      onMouseEnter={() => setHoveredAgent(agent)}
                      onMouseLeave={() => setHoveredAgent(null)}
                      className={`cursor-pointer group relative px-2.5 py-1.5 rounded-lg bg-slate-900 border flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                          : 'border-slate-800 hover:border-cyan-500/60 ' + colors.glow
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      )}
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {agent.name.replace('Hermes-', '')}
                      </span>
                      {renderStatusIcon(agent.status)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cluster B */}
            <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-blue-400 font-mono flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> CLUSTER B
                </div>
                <button
                  onClick={() => handleSelectCluster('Cluster B')}
                  className="text-[9px] font-mono text-blue-400 hover:underline uppercase"
                >
                  Select Cluster
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {clusterB.map((agent) => {
                  const colors = getStatusColor(agent.status);
                  const isSelected = selectedAgentIds.includes(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={(e) => handleAgentClick(agent, e)}
                      onMouseEnter={() => setHoveredAgent(agent)}
                      onMouseLeave={() => setHoveredAgent(null)}
                      className={`cursor-pointer group relative px-2.5 py-1.5 rounded-lg bg-slate-900 border flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                          : 'border-slate-800 hover:border-blue-500/60 ' + colors.glow
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      )}
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {agent.name.replace('Hermes-', '')}
                      </span>
                      {renderStatusIcon(agent.status)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cluster C */}
            <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-purple-400 font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> CLUSTER C
                </div>
                <button
                  onClick={() => handleSelectCluster('Cluster C')}
                  className="text-[9px] font-mono text-purple-400 hover:underline uppercase"
                >
                  Select Cluster
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {clusterC.map((agent) => {
                  const colors = getStatusColor(agent.status);
                  const isSelected = selectedAgentIds.includes(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={(e) => handleAgentClick(agent, e)}
                      onMouseEnter={() => setHoveredAgent(agent)}
                      onMouseLeave={() => setHoveredAgent(null)}
                      className={`cursor-pointer group relative px-2.5 py-1.5 rounded-lg bg-slate-900 border flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                          : 'border-slate-800 hover:border-purple-500/60 ' + colors.glow
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      )}
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {agent.name.replace('Hermes-', '')}
                      </span>
                      {renderStatusIcon(agent.status)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Information Tooltip Footer */}
      <div className="relative z-10 border-t border-slate-800/60 pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
        {hoveredAgent ? (
          <div className="flex items-center gap-4 text-cyan-300">
            <span>Agent: <strong className="text-white">{hoveredAgent.name}</strong></span>
            <span>Role: <strong className="text-cyan-400">{hoveredAgent.role}</strong></span>
            <span>Score: <strong className="text-emerald-400">{hoveredAgent.reputation.score}/100</strong></span>
            <span>Tasks: <strong>{hoveredAgent.reputation.tasksCompleted}</strong></span>
          </div>
        ) : (
          <div className="text-slate-500 italic">
            Click nodes to select agents for bulk controls, or shift-click / multi-select to target multiple agents.
          </div>
        )}
      </div>
    </div>
  );
};
