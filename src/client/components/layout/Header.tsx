import React, { useState } from 'react';
import { Send, Zap, Bot, Activity, Play, Keyboard, Home } from 'lucide-react';
import { HIVE_THEMES, useHiveTheme, HiveThemeId } from '../../theme/HiveTheme';

interface HeaderProps {
  connected: boolean;
  hiveHealthPct: number;
  onSendObjective: (command: string) => Promise<void>;
  onTriggerDemo: (scenario: string) => Promise<void>;
  onToggleShortcuts?: () => void;
  commandInputRef?: React.RefObject<HTMLInputElement>;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  hiveHealthPct,
  onSendObjective,
  onTriggerDemo,
  onToggleShortcuts,
  commandInputRef,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const { theme, setTheme } = useHiveTheme();

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || sending) return;

    setSending(true);
    try {
      await onSendObjective(quickPrompt);
      setQuickPrompt('');
    } catch (err) {
      // Fire-and-forget onSubmit: swallow so the rejection cannot escape as
      // an unhandled rejection.
      console.error('[Header] Quick objective failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between shrink-0 gap-4" style={{ background: 'linear-gradient(180deg, rgba(20,13,30,0.85), rgba(10,7,16,0.6))', backdropFilter: 'blur(14px) saturate(1.25)', WebkitBackdropFilter: 'blur(14px) saturate(1.25)', borderBottom: '1px solid rgba(255,179,71,0.14)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -18px rgba(0,0,0,0.8)' }}>
      {/* Back to Homepage */}
      <a
        href="/homepage/index.html"
        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.2em] font-light text-slate-400 border border-amber-500/15 bg-slate-900/50 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
        title="Back to HERMES-HIVE homepage"
      >
        <Home className="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-400" />
        <span className="hidden md:inline">Homepage</span>
      </a>

      {/* Theme Switcher — A/B/C design variants */}
      <div
        className="shrink-0 flex items-center gap-0.5 p-1 rounded-lg"
        style={{ background: 'rgba(20,13,30,0.55)', border: '1px solid rgba(var(--hh-a), 0.16)' }}
        role="radiogroup"
        aria-label="Design variant"
        title={`Theme: ${HIVE_THEMES[theme].name}`}
      >
        {(Object.keys(HIVE_THEMES) as HiveThemeId[]).map((id) => {
          const active = theme === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-[0.15em] transition-all cursor-pointer"
              style={
                active
                  ? { background: 'rgba(var(--hh-a), 0.16)', color: 'rgba(var(--hh-gold), 1)', boxShadow: '0 0 12px -2px rgba(var(--hh-a), 0.45)' }
                  : { color: 'rgba(154,138,160,0.85)' }
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: HIVE_THEMES[id].swatch, boxShadow: active ? `0 0 6px rgba(var(--hh-a),0.8)` : 'none' }}
              />
              {HIVE_THEMES[id].label}
            </button>
          );
        })}
      </div>

      {/* Quick Objective Dispatcher Input */}
      <form onSubmit={handleQuickSend} className="flex-1 max-w-2xl relative">
        <div className="relative flex items-center">
          <Bot className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={commandInputRef}
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="Command Hermes... (e.g., 'Run a full security audit', 'Create a research team for quantum crypto')"
            className="w-full bg-slate-900/70 text-xs font-light text-slate-100 placeholder-slate-500 pl-10 pr-32 py-2.5 rounded-lg border border-amber-500/10 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all font-sans"
          />
          <div className="absolute right-20 hidden sm:flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-950/80 rounded border border-slate-800">
              ⌘K
            </kbd>
          </div>
          <button
            type="submit"
            disabled={!quickPrompt.trim() || sending}
            className="absolute right-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1 transition-all"
          >
            {sending ? (
              <span className="w-3 h-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Dispatch</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Status Bar Controls & Health Indicators */}
      <div className="flex items-center gap-3">
        {/* Keyboard Shortcuts Helper Toggle */}
        <button
          onClick={onToggleShortcuts}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-all text-xs group"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-[11px] font-medium">Hotkeys</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
            ?
          </kbd>
        </button>

        {/* Quick Demo Scenario Trigger */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400 font-medium">Demo:</span>
          <button
            onClick={() => onTriggerDemo('security_audit')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 transition-all"
          >
            Security Audit
          </button>
          <button
            onClick={() => onTriggerDemo('quantum_crypto')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/40 transition-all"
          >
            Quantum Crypto
          </button>
        </div>

        {/* AI Provider Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(20,13,30,0.6)', border: '1px solid rgba(255,179,71,0.14)' }}>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Model:</span>
          <span className="font-mono text-slate-200 font-semibold">Gemini 3.6 Flash</span>
        </div>

        {/* Hive Health Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(20,13,30,0.6)', border: '1px solid rgba(255,179,71,0.14)' }}>
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Health:</span>
          <span className={`font-mono font-bold ${hiveHealthPct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {hiveHealthPct}%
          </span>
        </div>

        {/* Real-Time SSE Stream Pulse */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? 'bg-amber-400 heartbeat shadow-[0_0_10px_rgba(255,179,71,0.9)]' : 'bg-red-400'
            }`}
          />
          <span className="text-slate-400 text-[11px] uppercase tracking-[0.2em] font-light hidden sm:inline">
            {connected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>
    </header>
  );
};
