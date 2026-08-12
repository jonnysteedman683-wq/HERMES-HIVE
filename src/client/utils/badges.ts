import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface StatusBadge {
  label: string;
  bg: string;
  icon: LucideIcon;
}

export interface SeverityBadge extends StatusBadge {
  /** dot color for severity indicators */
  dot: string;
}

/**
 * Look up a badge entry, falling back to the map's `default` row.
 * Maps whose `default.label` is an empty string render the raw status key
 * instead (matches the original switch statements' `label: status` fallback).
 */
export function badgeFor<T extends StatusBadge = StatusBadge>(map: Record<string, T>, key: string): T {
  const hit = map[key];
  if (hit) return hit;
  const dflt = map.default;
  return dflt.label === '' ? { ...dflt, label: key } : dflt;
}

/** Look up a status→class-string map, falling back to the map's `default` row. */
export function clsFor(map: Record<string, string>, key: string): string {
  return map[key] ?? map.default;
}

/** Hive event severity → badge (label/bg/icon) + indicator dot color. */
export const SEVERITY_BADGE: Record<string, SeverityBadge> = {
  error: { label: 'ERROR', bg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: ShieldAlert, dot: 'bg-red-400' },
  warning: { label: 'WARN', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: AlertTriangle, dot: 'bg-amber-400' },
  success: { label: 'SUCCESS', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2, dot: 'bg-emerald-400' },
  default: { label: 'INFO', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Info, dot: 'bg-cyan-400' },
};

/** MissionTask status → badge. Unknown statuses render their raw value. */
export const TASK_STATUS_BADGE: Record<string, StatusBadge> = {
  completed: { label: 'Completed', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  running: { label: 'Executing', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Activity },
  failed: { label: 'Failed', bg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: AlertTriangle },
  pending: { label: 'Pending', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock },
  default: { label: '', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock },
};

/** Mission status → badge. Unknown statuses render their raw value. */
export const MISSION_STATUS_BADGE: Record<string, StatusBadge> = {
  completed: { label: 'Completed', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Clock },
  failed: { label: 'Failed', bg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: AlertTriangle },
  default: { label: '', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock },
};

/** Agent status → badge class string (includes its own `border` utility). */
export const AGENT_STATUS_BADGE: Record<string, string> = {
  working: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  idle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  paused: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  default: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

/** Debate proposal status → class string. */
export const PROPOSAL_STATUS_CLS: Record<string, string> = {
  CONSENSUS_REACHED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  GOVERNANCE_BLOCKED: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  default: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

/** Experiment status → class string. */
export const EXPERIMENT_STATUS_CLS: Record<string, string> = {
  PROMOTED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  VERIFIED: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  default: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

/** Capability status → class string. */
export const CAPABILITY_STATUS_CLS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  VALIDATED: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  SIMULATED: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  default: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

/** Hive sync status → indicator dot class string. */
export const HIVE_STATUS_CLS: Record<string, string> = {
  ONLINE: 'bg-emerald-500',
  SYNCHRONIZING: 'bg-amber-500 animate-pulse',
  default: 'bg-rose-500',
};

/** Mutation status → class string. */
export const MUTATION_STATUS_CLS: Record<string, string> = {
  DEPLOYED_MUTATION: 'bg-emerald-950 text-emerald-400',
  SANDBOX_VERIFIED: 'bg-indigo-950 text-indigo-400',
  RESTRICTED: 'bg-rose-950 text-rose-400',
  default: 'bg-amber-950 text-amber-400',
};

/** Symbiosis session status → class string. */
export const SESSION_STATUS_CLS: Record<string, string> = {
  COMPLETED: 'bg-emerald-950 text-emerald-400',
  CONSOLIDATED: 'bg-purple-950 text-purple-400',
  default: 'bg-amber-950 text-amber-400 animate-pulse',
};
