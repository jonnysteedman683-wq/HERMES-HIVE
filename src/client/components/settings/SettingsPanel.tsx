import React from 'react';
import { Settings, Play, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

interface SettingsPanelProps {
  onTriggerDemo: (scenario: string) => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onTriggerDemo }) => {
  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-1">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              SYSTEM CONFIGURATION & DEMO BENCHMARKS
            </h2>
            <p className="text-xs text-slate-400">
              Configure Hermes executive parameters, model aliases, self-healing heartbeat intervals, and run prebuilt live demo scenarios.
            </p>
          </div>
        </div>
      </div>

      {/* Prebuilt Live Demo Scenarios */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" /> One-Click Live Swarm Demo Scenarios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" /> Security & Vulnerability Audit
            </div>
            <p className="text-xs text-slate-400">
              Hermes decomposes a full security audit across microservices. Deploys Security, Code Quality, and Critic agents to analyze code and verify output.
            </p>
            <button
              onClick={() => onTriggerDemo('security_audit')}
              className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Run Security Audit Demo
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Post-Quantum Cryptography
            </div>
            <p className="text-xs text-slate-400">
              Researches post-quantum encryption algorithms (Kyber/Dilithium) and generates API migration specifications across agents.
            </p>
            <button
              onClick={() => onTriggerDemo('quantum_crypto')}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Run Quantum Crypto Demo
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Architecture & Performance
            </div>
            <p className="text-xs text-slate-400">
              Identifies repository bottlenecks, runs memory heap analysis, and provides refactoring deliverables.
            </p>
            <button
              onClick={() => onTriggerDemo('refactor_core')}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Run Refactor Demo
            </button>
          </div>
        </div>
      </div>

      {/* System Settings & Engine Status */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          System Engine Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 text-[11px]">AI Model Provider</div>
            <div className="text-slate-100 font-bold flex items-center gap-2">
              Google Gemini 3.6 Flash (Server-Side)
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Configured via process.env.GEMINI_API_KEY with fallback local reasoning.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 text-[11px]">Self-Healing Supervisor</div>
            <div className="text-slate-100 font-bold flex items-center gap-2">
              15-Second Heartbeat Monitoring Active
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Auto-recovery strategy: Retry -&gt; Reassign -&gt; Escalate to Hermes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
