import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Target,
  Network,
  Database,
  Activity,
  Wrench,
  BarChart3,
  Settings,
  Sparkles,
  ShieldAlert,
  Brain,
  Compass,
  Globe2,
  Globe,
  BrainCircuit,
  Dna,
  Workflow,
  Zap,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'hermes'
  | 'web'
  | 'selfmodel'
  | 'evolution'
  | 'collective'
  | 'federation'
  | 'goals'
  | 'governance'
  | 'cognition'
  | 'missions'
  | 'swarm'
  | 'suprime'
  | 'memory'
  | 'events'
  | 'tools'
  | 'diagnostics'
  | 'settings'
  | 'backends'
  | 'swarm-monitor';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeAgentsCount: number;
  activeMissionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAgentsCount,
  activeMissionsCount,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hermes', label: 'Hermes Chat & Console', icon: Bot },
    { id: 'web', label: 'Hermes Web Fabric', icon: Globe },
    { id: 'collective', label: 'Swarm Collective', icon: Brain },
    { id: 'selfmodel', label: 'Self-Model & Twin', icon: BrainCircuit },
    { id: 'evolution', label: 'Evolution & Portfolio', icon: Dna },
    { id: 'federation', label: 'Federation & Hive OS', icon: Globe2 },
    { id: 'goals', label: 'Goal & Autonomy Loop', icon: Compass },
    { id: 'governance', label: 'Governance & Risk', icon: ShieldAlert },
    { id: 'cognition', label: 'Cognition & World', icon: Brain },
    { id: 'missions', label: 'Missions & Tasks', icon: Target, badge: activeMissionsCount },
    { id: 'swarm', label: 'Swarm & Agents', icon: Network, badge: activeAgentsCount },
    { id: 'swarm-monitor', label: 'Swarm Monitor', icon: Zap },
    { id: 'suprime', label: 'SUPRIME Swarm', icon: Workflow },
    { id: 'memory', label: 'Hive Memory', icon: Database },
    { id: 'events', label: 'Event Stream', icon: Activity },
    { id: 'tools', label: 'Tool Registry', icon: Wrench },
    { id: 'diagnostics', label: 'Diagnostics', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Demo', icon: Settings },
    { id: 'backends', label: 'Backends', icon: Workflow },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
                HERMES <span className="text-cyan-400 font-extrabold">HIVE</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Swarm Control Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono rounded-full ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SWARM ONLINE
          </span>
          <span className="font-mono text-[10px] text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
            v3.6-FLASH
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800/60 text-[11px] text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">Bounded Concurrency Engine</span>
        </div>
      </div>
    </aside>
  );
};
