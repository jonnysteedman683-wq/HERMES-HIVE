import React, { useState } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { Compass, Target, Coins, Cpu, Play, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Goal, OperatingMode, ResourceBudget } from '../../../shared/types';

export const GoalHierarchyView: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<ResourceBudget[]>([]);
  const [mode, setMode] = useState<OperatingMode>('SUPERVISED_AUTONOMOUS');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [goalRes, budRes, modeRes] = await Promise.all([
        fetch('/api/goals').then((r) => r.json()).catch(() => ({ goals: [] })),
        fetch('/api/resources/budgets').then((r) => r.json()).catch(() => ({ budgets: [] })),
        fetch('/api/loop/mode').then((r) => r.json()).catch(() => ({ mode: 'SUPERVISED_AUTONOMOUS' })),
      ]);

      if (goalRes.goals) setGoals(goalRes.goals);
      if (budRes.budgets) setBudgets(budRes.budgets);
      if (modeRes.mode) setMode(modeRes.mode);
      setLoading(false);
    } catch (err) {
      console.error('[GoalHierarchyView] Error loading data:', err);
      setLoading(false);
    }
  };

  usePolling(fetchData, 3000);

  const handleModeChange = async (newMode: OperatingMode) => {
    try {
      setMode(newMode);
      await fetch('/api/loop/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      await fetchData();
    } catch (err) {
      console.error('[GoalHierarchyView] Error changing operating mode:', err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Header Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 rounded-xl border border-cyan-500/20 shadow-lg gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              GOAL ENGINE & AUTONOMOUS LOOP CONTROL
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Hierarchical Objectives
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage parent/child goals, autonomous loop execution, and resource token economies.
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['MANUAL', 'ASSISTED', 'AUTONOMOUS', 'SUPERVISED_AUTONOMOUS'] as OperatingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                mode === m
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Tree Hierarchy View */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Active Hierarchical Goal Graph ({goals.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Mission goals with parent/child dependencies</span>
        </div>

        {goals.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
            <Target className="w-8 h-8 text-cyan-400/50 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No active goals registered in Goal Manager.</p>
            <p className="text-[11px] text-slate-500 mt-1">Submit an objective in Hermes Executive to generate goal trees.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="p-4 bg-slate-900/70 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      {goal.status}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{goal.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Goal ID: {goal.id}</span>
                </div>

                <p className="text-xs text-slate-300 font-sans">{goal.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Progress: {goal.successCriteriaCount ? Math.round((goal.completedCriteriaCount / goal.successCriteriaCount) * 100) : 100}%</span>
                    <span>{goal.completedCriteriaCount} / {goal.successCriteriaCount} Criteria</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${goal.successCriteriaCount ? Math.round((goal.completedCriteriaCount / goal.successCriteriaCount) * 100) : 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resource Economy Budgets */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Resource Economy Budgets & Usage Gauges ({budgets.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Token & API call limits per mission/agent</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const tokenPct = Math.min(100, Math.round((b.consumedTokens / b.maxTokens) * 100));
            return (
              <div key={b.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span className="capitalize">{b.entityType}: {b.entityId}</span>
                  <span className="font-mono text-amber-300">{b.consumedTokens} / {b.maxTokens} tokens</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tokenPct > 90 ? 'bg-rose-500' : tokenPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${tokenPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>API Calls: {b.consumedApiCalls} / {b.maxApiCalls}</span>
                  <span>{tokenPct}% Consumed</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
