import React, { useState } from 'react';
import { TabType } from '../layout/Sidebar';
import {
  Bot,
  Sparkles,
  X,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  Activity,
  Layers,
} from 'lucide-react';

interface AskHermesFloatingWidgetProps {
  activeTab: TabType;
  onAskHermes: (query: string, contextTitle: string) => void;
}

export const AskHermesFloatingWidget: React.FC<AskHermesFloatingWidgetProps> = ({
  activeTab,
  onAskHermes,
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);

  // If on hermes chat tab already, don't show floating widget
  if (activeTab === 'hermes') return null;

  const tabContextMap: Record<
    string,
    { title: string; prompt: string; quickActions: string[] }
  > = {
    dashboard: {
      title: 'Executive Dashboard',
      prompt: "What's happening across the Hive right now?",
      quickActions: [
        'Summarize active swarm status',
        'Check overall Hive health',
        'List pending executive actions',
      ],
    },
    missions: {
      title: 'Missions & Tasks',
      prompt: 'Ask Hermes about these missions',
      quickActions: [
        'Why is the active mission progressing slowly?',
        'Decompose mission into sub-tasks',
        'Create a new high-priority research mission',
      ],
    },
    swarm: {
      title: 'Swarm Agents & Topology',
      prompt: 'Ask Hermes about swarm topology & agents',
      quickActions: [
        'Are any agents overloaded or failing?',
        'Inspect active agent capabilities',
        'Rebalance agent workload across hives',
      ],
    },
    diagnostics: {
      title: 'Deep Diagnostics & Causal Tracing',
      prompt: 'Ask Hermes to investigate recent incidents',
      quickActions: [
        'Identify root cause of recent failure',
        'Run chaos diagnostic simulation',
        'Show causal trace for latest incident',
      ],
    },
    web: {
      title: 'Hermes Web Capability Bridge',
      prompt: 'Ask Hermes about Web capabilities & health',
      quickActions: [
        'Check Hermes Web capability bridge health',
        'Discover newly registered web capabilities',
        'Evaluate latency of external providers',
      ],
    },
    federation: {
      title: 'Federated Hives & Multi-Hive Mesh',
      prompt: 'Ask Hermes about federated hives',
      quickActions: [
        'Evaluate inter-hive trust scores',
        'Check federation consensus status',
        'Identify rogue or quarantined hives',
      ],
    },
    selfmodel: {
      title: 'Self-Model & Digital Twin',
      prompt: 'Ask Hermes about self-model state',
      quickActions: [
        'Evaluate digital twin accuracy',
        'Analyze system cognitive drift',
        'Predict future system bottleneck',
      ],
    },
    collective: {
      title: 'Swarm Collective & Consciousness',
      prompt: 'Ask Hermes about collective synthesis',
      quickActions: [
        'Inspect dissent in recent consensus',
        'Analyze collective reasoning quality',
        'Check swarm value alignment',
      ],
    },
    evolution: {
      title: 'Agent Evolution & Mutation',
      prompt: 'Ask Hermes about agent evolution',
      quickActions: [
        'Review recent agent mutations',
        'Check fitness score improvements',
        'Trigger safe evolutionary cycle',
      ],
    },
    goals: {
      title: 'Goal Hierarchy & Planning',
      prompt: 'Ask Hermes about goal alignment',
      quickActions: [
        'Review top-level strategic goals',
        'Detect conflicting sub-goals',
        'Optimize goal execution path',
      ],
    },
    governance: {
      title: 'Governance & Policy',
      prompt: 'Ask Hermes about governance & policies',
      quickActions: [
        'Audit recent action authorizations',
        'Check risk policy compliance',
        'Review executive permission levels',
      ],
    },
    cognition: {
      title: 'Cognition & Reasoning',
      prompt: 'Ask Hermes about cognitive processing',
      quickActions: [
        'Show active deliberation chains',
        'Inspect decision confidence scores',
        'Analyze memory recall efficiency',
      ],
    },
    memory: {
      title: 'Persistent Memory Ledger',
      prompt: 'Ask Hermes about memory records',
      quickActions: [
        'Search episodic memory for incidents',
        'Inspect causal knowledge provenance',
        'Consolidate long-term memories',
      ],
    },
    events: {
      title: 'Real-Time Event Stream',
      prompt: 'Ask Hermes about recent system events',
      quickActions: [
        'Filter high-severity system events',
        'Correlate event timeline',
        'Explain anomaly event spike',
      ],
    },
    tools: {
      title: 'Tool & Sandbox Console',
      prompt: 'Ask Hermes about tool executions',
      quickActions: [
        'Audit tool execution security',
        'Test sandbox tool isolation',
        'Show tool execution metrics',
      ],
    },
    settings: {
      title: 'System Settings',
      prompt: 'Ask Hermes about settings & configuration',
      quickActions: [
        'Audit security configuration',
        'Check API key rate limits',
        'Verify backup persistence state',
      ],
    },
  };

  const contextInfo = tabContextMap[activeTab] || {
    title: 'Current Dashboard View',
    prompt: `Ask Hermes about this ${activeTab} view`,
    quickActions: [
      `Summarize ${activeTab} state`,
      `Investigate ${activeTab} metrics`,
    ],
  };

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={() => setMinimized(false)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-2xl shadow-cyan-500/40 border border-cyan-300/40 transition-all transform hover:scale-105"
        >
          <Bot className="w-5 h-5 animate-bounce" />
          <span>Ask Hermes ({contextInfo.title})</span>
          <Sparkles className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 p-4 space-y-3 font-sans backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 shadow-inner">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
              <span>Ask Hermes</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-cyan-400 font-mono truncate max-w-[200px]">
              Context: {contextInfo.title}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMinimized(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          title="Minimize floating card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Floating Action Card Trigger */}
      <button
        onClick={() => onAskHermes(contextInfo.prompt, contextInfo.title)}
        className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-900/40 text-slate-200 transition-all group flex items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-cyan-100 truncate">
            {contextInfo.prompt}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Quick Action Suggestions */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
          Quick Contextual Prompts
        </span>
        <div className="space-y-1">
          {contextInfo.quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => onAskHermes(qa, contextInfo.title)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-300 border border-slate-800/80 text-[11px] font-medium transition-all flex items-center justify-between gap-2"
            >
              <span className="truncate">{qa}</span>
              <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
