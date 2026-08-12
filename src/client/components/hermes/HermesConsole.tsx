import React, { useState } from 'react';
import { formatTime } from '../../utils/format';
import { HermesDecision } from '../../../shared/types';
import { Bot, Send, Sparkles, CheckCircle2, Zap, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

interface HermesConsoleProps {
  decisions: HermesDecision[];
  onSendCommand: (command: string) => Promise<void>;
  onTriggerDemo: (scenario: string) => Promise<void>;
}

export const HermesConsole: React.FC<HermesConsoleProps> = ({
  decisions,
  onSendCommand,
  onTriggerDemo,
}) => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    try {
      await onSendCommand(command);
      setCommand('');
    } catch (err) {
      // onSubmit handlers are fire-and-forget: a rejection would escape as an
      // unhandled rejection. Surface it in the console and keep the input.
      console.error('[HermesConsole] Command failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Analyze my repository and identify architectural weaknesses.',
    'Build an agent capable of analyzing TypeScript microservices.',
    'Run a security audit across external API endpoints.',
    'Rebalance the swarm and optimize resource allocations.',
    'Create three competing solutions for post-quantum encryption migration.',
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Hermes Executive Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
            <Bot className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              HERMES EXECUTIVE CONSOLE
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                Gemini 3.6 Flash Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Direct executive interface. Hermes translates human objectives into mission task graphs, agent assignments, and swarm operations.
            </p>
          </div>
        </div>

        {/* Quick Demo Scenario Triggers */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400 pl-1">Scenarios:</span>
          <button
            onClick={() => onTriggerDemo('security_audit')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all"
          >
            Security Audit
          </button>
          <button
            onClick={() => onTriggerDemo('quantum_crypto')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
          >
            Quantum Crypto
          </button>
        </div>
      </div>

      {/* Main Console & Command Prompt */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left 2 Cols: Hermes Command Dispatcher & Prompt Samples */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-cyan-400" /> Human Operator Command Input
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Describe your objective for Hermes... (e.g. 'Perform an architectural refactoring assessment and deploy verifier agents to test code quality')"
                rows={4}
                className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> All decisions validated before swarm execution
                </div>

                <button
                  type="submit"
                  disabled={!command.trim() || loading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Formulating Task Graph...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Objective to Hermes</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-mono font-bold text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sample Swarm Objectives
            </h4>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommand(p)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-800/80 text-xs text-left transition-all flex items-center gap-2"
                >
                  <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Executive Decision Log */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl min-h-0">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" /> Hermes Executive Decisions ({decisions.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-sans">
            {decisions.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
                No decisions generated yet. Dispatch an objective above to trigger Hermes reasoning.
              </div>
            ) : (
              decisions.map((dec) => (
                <div key={dec.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-bold">
                      {dec.type}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {Math.round(dec.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans">{dec.reasoningSummary}</p>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>{dec.actions.length} Swarm Actions</span>
                    <span>{formatTime(dec.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
