import { Agent } from '../../shared/types';

/**
 * Shared status → style mappings.
 * Consolidates the status/health color maps that were duplicated across
 * SwarmTopology, AgentInspector, BackendsView and others.
 */

export interface AgentStatusVisual {
  bg: string;
  stroke: string;
  glow: string;
}

const AGENT_STATUS_VISUALS: Record<Agent['status'], AgentStatusVisual> = {
  working: { bg: 'bg-cyan-500', stroke: '#06b6d4', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]' },
  idle: { bg: 'bg-emerald-500', stroke: '#10b981', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
  paused: { bg: 'bg-amber-500', stroke: '#f59e0b', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
  failed: { bg: 'bg-red-500', stroke: '#ef4444', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
  waiting: { bg: 'bg-slate-500', stroke: '#64748b', glow: '' },
  terminated: { bg: 'bg-slate-500', stroke: '#64748b', glow: '' },
};

const DEFAULT_VISUAL: AgentStatusVisual = { bg: 'bg-slate-500', stroke: '#64748b', glow: '' };

/** Node colors (bg class, SVG stroke, glow shadow) for an agent status. */
export function agentStatusVisual(status: Agent['status']): AgentStatusVisual {
  return AGENT_STATUS_VISUALS[status] ?? DEFAULT_VISUAL;
}

const AGENT_STATUS_BADGES: Record<Agent['status'], string> = {
  working: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  idle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  paused: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/40',
  waiting: 'bg-red-500/20 text-red-300 border border-red-500/40',
  terminated: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

const DEFAULT_BADGE = 'bg-red-500/20 text-red-300 border border-red-500/40';

/** Pill/badge classes for an agent status. */
export function agentStatusBadgeClass(status: Agent['status']): string {
  return AGENT_STATUS_BADGES[status] ?? DEFAULT_BADGE;
}

/** Small status-dot class for a backend health status ('ok' | 'error' | other). */
export function backendStatusDotClass(status: string): string {
  if (status === 'ok') return 'bg-emerald-400';
  if (status === 'error') return 'bg-red-400';
  return 'bg-amber-400';
}

/** Group agents into Cluster A (incl. unassigned), B and C buckets. */
export function groupAgentsByCluster(agents: Agent[]): {
  clusterA: Agent[];
  clusterB: Agent[];
  clusterC: Agent[];
} {
  return {
    clusterA: agents.filter((a) => a.clusterId === 'Cluster A' || !a.clusterId),
    clusterB: agents.filter((a) => a.clusterId === 'Cluster B'),
    clusterC: agents.filter((a) => a.clusterId === 'Cluster C'),
  };
}
