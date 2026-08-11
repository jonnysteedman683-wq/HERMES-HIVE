import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  X,
  Search,
  LayoutDashboard,
  Bot,
  Globe,
  Brain,
  BrainCircuit,
  Dna,
  Globe2,
  Compass,
  ShieldAlert,
  Target,
  Network,
  Database,
  Activity,
  Wrench,
  BarChart3,
  Settings,
  Terminal,
  RotateCw,
  Play,
  MessageSquarePlus,
  Zap,
} from 'lucide-react';
import { TabType } from '../layout/Sidebar';

export interface ShortcutItem {
  id: string;
  category: 'Navigation' | 'Actions & Controls' | 'System & Modals';
  label: string;
  description: string;
  keys: string[];
  tabTarget?: TabType;
  actionType?: 'command_focus' | 'ask_hermes' | 'refresh' | 'demo_audit' | 'toggle_shortcuts';
  icon?: React.FC<{ className?: string }>;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  onFocusCommandInput?: () => void;
  onTriggerDemo?: (scenario: string) => void;
  onRefreshData?: () => void;
}

export const SHORTCUT_LIST: ShortcutItem[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    category: 'Navigation',
    label: 'Dashboard Overview',
    description: 'Jump to main Hive health and agent telemetry dashboard',
    keys: ['1', 'or', 'G', 'D'],
    tabTarget: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'nav-hermes',
    category: 'Navigation',
    label: 'Hermes Chat & Console',
    description: 'Open executive AI chat console and multi-agent controller',
    keys: ['2', 'or', 'G', 'H'],
    tabTarget: 'hermes',
    icon: Bot,
  },
  {
    id: 'nav-web',
    category: 'Navigation',
    label: 'Hermes Web Fabric',
    description: 'Access live external Web capability bridge and network tools',
    keys: ['3', 'or', 'G', 'W'],
    tabTarget: 'web',
    icon: Globe,
  },
  {
    id: 'nav-collective',
    category: 'Navigation',
    label: 'Swarm Collective',
    description: 'Inspect collective intelligence, evolution, and consensus observatory',
    keys: ['4', 'or', 'G', 'C'],
    tabTarget: 'collective',
    icon: Brain,
  },
  {
    id: 'nav-swarm',
    category: 'Navigation',
    label: 'Swarm & Agents Topology',
    description: 'View real-time agent topology graph and active worker states',
    keys: ['5', 'or', 'G', 'S'],
    tabTarget: 'swarm',
    icon: Network,
  },
  {
    id: 'nav-missions',
    category: 'Navigation',
    label: 'Missions & Tasks',
    description: 'Monitor active multi-agent missions and task decomposition',
    keys: ['6', 'or', 'G', 'M'],
    tabTarget: 'missions',
    icon: Target,
  },
  {
    id: 'nav-memory',
    category: 'Navigation',
    label: 'Hive Memory Explorer',
    description: 'Search persistent neural memory, observations, and evidence',
    keys: ['7', 'or', 'G', 'K'],
    tabTarget: 'memory',
    icon: Database,
  },
  {
    id: 'nav-events',
    category: 'Navigation',
    label: 'Real-Time Event Stream',
    description: 'Audit live system event bus telemetry and message logs',
    keys: ['8', 'or', 'G', 'E'],
    tabTarget: 'events',
    icon: Activity,
  },
  {
    id: 'nav-tools',
    category: 'Navigation',
    label: 'Tool & Capability Registry',
    description: 'Explore capability schemas, risk rankings, and tool metrics',
    keys: ['9', 'or', 'G', 'T'],
    tabTarget: 'tools',
    icon: Wrench,
  },
  {
    id: 'nav-governance',
    category: 'Navigation',
    label: 'Governance & Risk Console',
    description: 'Inspect policy engine rules, approval queues, and emergency controls',
    keys: ['G', 'G'],
    tabTarget: 'governance',
    icon: ShieldAlert,
  },
  {
    id: 'nav-cognition',
    category: 'Navigation',
    label: 'Cognition & World Model',
    description: 'View dynamic entity relationships, world model, and causal graphs',
    keys: ['G', 'O'],
    tabTarget: 'cognition',
    icon: BrainCircuit,
  },
  {
    id: 'nav-goals',
    category: 'Navigation',
    label: 'Goal & Autonomy Loop',
    description: 'Review high-level goal hierarchy and autonomous drive state',
    keys: ['G', 'A'],
    tabTarget: 'goals',
    icon: Compass,
  },
  {
    id: 'nav-federation',
    category: 'Navigation',
    label: 'Federation & Hive OS',
    description: 'Manage inter-hive federation peering, tokens, and cluster sync',
    keys: ['G', 'F'],
    tabTarget: 'federation',
    icon: Globe2,
  },
  {
    id: 'nav-selfmodel',
    category: 'Navigation',
    label: 'Self-Model & Digital Twin',
    description: 'Examine self-referential identity, capabilities, and twin mirror',
    keys: ['G', 'M'],
    tabTarget: 'selfmodel',
    icon: BrainCircuit,
  },
  {
    id: 'nav-evolution',
    category: 'Navigation',
    label: 'Evolution & Portfolio',
    description: 'Track prompt mutations, fitness scores, and strategy evolution',
    keys: ['G', 'V'],
    tabTarget: 'evolution',
    icon: Dna,
  },
  {
    id: 'nav-diagnostics',
    category: 'Navigation',
    label: 'System Diagnostics',
    description: 'View CPU/Memory allocation, latency breakdown, and health metrics',
    keys: ['G', 'X'],
    tabTarget: 'diagnostics',
    icon: BarChart3,
  },
  {
    id: 'nav-settings',
    category: 'Navigation',
    label: 'Settings & Config',
    description: 'Configure API endpoints, execution parameters, and demo triggers',
    keys: ['G', ','],
    tabTarget: 'settings',
    icon: Settings,
  },

  // Actions & Controls
  {
    id: 'action-command-focus',
    category: 'Actions & Controls',
    label: 'Focus Command Bar',
    description: 'Jump directly to top header prompt input to dispatch Hermes commands',
    keys: ['⌘', 'K'],
    actionType: 'command_focus',
    icon: Terminal,
  },
  {
    id: 'action-ask-hermes',
    category: 'Actions & Controls',
    label: 'Toggle Ask Hermes Widget',
    description: 'Open quick context-aware Hermes assistance floating card',
    keys: ['Shift', 'A'],
    actionType: 'ask_hermes',
    icon: MessageSquarePlus,
  },
  {
    id: 'action-demo-audit',
    category: 'Actions & Controls',
    label: 'Run Security Audit Demo',
    description: 'Instantly launch automated multi-agent security audit scenario',
    keys: ['Shift', 'D'],
    actionType: 'demo_audit',
    icon: Play,
  },
  {
    id: 'action-refresh',
    category: 'Actions & Controls',
    label: 'Refresh Hive Telemetry',
    description: 'Pull latest agent states, mission status, and event bus records',
    keys: ['Shift', 'R'],
    actionType: 'refresh',
    icon: RotateCw,
  },

  // System & Modals
  {
    id: 'sys-toggle-shortcuts',
    category: 'System & Modals',
    label: 'Toggle Shortcuts Helper',
    description: 'Show or hide this keyboard shortcut reference guide',
    keys: ['?'],
    actionType: 'toggle_shortcuts',
    icon: Keyboard,
  },
  {
    id: 'sys-escape',
    category: 'System & Modals',
    label: 'Close Active Modal / Drawer',
    description: 'Close inspector drawer, modal windows, or unfocus active text inputs',
    keys: ['Esc'],
    icon: X,
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onFocusCommandInput,
  onTriggerDemo,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Navigation', 'Actions & Controls', 'System & Modals'];

  const filteredShortcuts = useMemo(() => {
    return SHORTCUT_LIST.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keys.some((k) => k.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleShortcutClick = (item: ShortcutItem) => {
    if (item.tabTarget) {
      onNavigateTab(item.tabTarget);
      onClose();
    } else if (item.actionType === 'command_focus') {
      onClose();
      setTimeout(() => onFocusCommandInput?.(), 50);
    } else if (item.actionType === 'demo_audit') {
      onTriggerDemo?.('security_audit');
      onClose();
    } else if (item.actionType === 'refresh') {
      onRefreshData?.();
      onClose();
    } else if (item.actionType === 'toggle_shortcuts') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl shadow-cyan-950/30 flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Swarm Keyboard Shortcuts
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  Quick Navigation
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Press key combinations to instantly navigate views, dispatch actions, or trigger demos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotkeys or views..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Grid List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-medium">No shortcuts matching "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching for a different view or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredShortcuts.map((item) => {
                const IconComponent = item.icon || Zap;
                const isNav = Boolean(item.tabTarget);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleShortcutClick(item)}
                    className="group p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow-cyan-950/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/30 group-hover:text-cyan-400 text-slate-400 transition-all shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                            {item.label}
                          </h3>
                          {isNav && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                              View
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Key Combination Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, idx) => {
                        if (k === 'or') {
                          return (
                            <span key={idx} className="text-[10px] text-slate-500 px-0.5 font-mono">
                              /
                            </span>
                          );
                        }
                        return (
                          <kbd
                            key={idx}
                            className="min-w-[22px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 group-hover:border-cyan-500/50 group-hover:bg-slate-900/90 text-slate-200 group-hover:text-cyan-300 font-mono text-[11px] font-bold text-center shadow-inner tracking-tight"
                          >
                            {k}
                          </kbd>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Shortcuts active across all views</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
              Esc
            </kbd>
            <span>or click outside to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
