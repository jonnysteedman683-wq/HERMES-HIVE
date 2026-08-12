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
    <aside className="glass w-64 flex flex-col justify-between shrink-0 select-none" style={{ borderRadius: 0, borderRight: '1px solid rgba(255,179,71,0.12)' }}>
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-amber-500/10 flex items-center justify-between bg-gradient-to-r from-amber-950/20 via-slate-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 glow-amber">
              <Sparkles className="w-5 h-5 heartbeat" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div>
              <h1 className="text-base font-extralight tracking-[0.28em] text-slate-100 flex items-center gap-1.5 text-glow-amber">
                HERMES <span className="text-amber-400 font-normal">HIVE</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-light">
                Autonomous Swarm
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-light tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25 glow-amber'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent hover:border-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono rounded-full ${
                      isActive
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
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
      <div className="p-4 border-t border-amber-500/10 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-light tracking-wider text-[11px] uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 heartbeat" />
            Hive Alive
          </span>
          <span className="font-mono text-[10px] text-amber-400/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
            v3.6
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-amber-500/10 text-[11px] text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate font-light">Bounded Concurrency Engine</span>
        </div>
      </div>
    </aside>
  );
};
