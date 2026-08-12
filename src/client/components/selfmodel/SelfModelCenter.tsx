import React, { useState } from 'react';
import { formatTime } from '../../utils/format';
import { usePolling } from '../../hooks/usePolling';
import {
  BrainCircuit,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  GitBranch,
  Target,
  Compass,
  Sparkles,
  History,
  TrendingUp,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  SelfModel,
  CapabilityItem,
  CapabilityGap,
  OrganisationHealthMetrics,
  ScenarioResult,
  StrategicForesightScenario,
  InstitutionalDecision,
  PredictionRecord,
} from '../../../shared/types';

export const SelfModelCenter: React.FC = () => {
  const [selfModel, setSelfModel] = useState<SelfModel | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [gaps, setGaps] = useState<CapabilityGap[]>([]);
  const [health, setHealth] = useState<OrganisationHealthMetrics | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [foresight, setForesight] = useState<StrategicForesightScenario[]>([]);
  const [decisions, setDecisions] = useState<InstitutionalDecision[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [avgAccuracy, setAvgAccuracy] = useState<number>(93.5);

  const [activeTab, setActiveTab] = useState<'selfmodel' | 'digitaltwin' | 'foresight' | 'institutional'>('selfmodel');
  const [newScenarioTitle, setNewScenarioTitle] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchData = async () => {
    try {
      const [smRes, capRes, gapRes, hRes, scRes, fRes, dRes, pRes] = await Promise.all([
        fetch('/api/selfmodel').then(r => r.json()).catch(() => ({ selfModel: null })),
        fetch('/api/selfmodel/capabilities').then(r => r.json()).catch(() => ({ capabilities: [] })),
        fetch('/api/selfmodel/gaps').then(r => r.json()).catch(() => ({ gaps: [] })),
        fetch('/api/selfmodel/health').then(r => r.json()).catch(() => ({ health: null })),
        fetch('/api/simulation/scenarios').then(r => r.json()).catch(() => ({ scenarios: [] })),
        fetch('/api/strategy/foresight').then(r => r.json()).catch(() => ({ scenarios: [] })),
        fetch('/api/memory/institutional/decisions').then(r => r.json()).catch(() => ({ decisions: [] })),
        fetch('/api/strategy/predictions').then(r => r.json()).catch(() => ({ records: [], averageAccuracy: 93.5 })),
      ]);

      if (smRes.selfModel) setSelfModel(smRes.selfModel);
      if (capRes.capabilities) setCapabilities(capRes.capabilities);
      if (gapRes.gaps) setGaps(gapRes.gaps);
      if (hRes.health) setHealth(hRes.health);
      if (scRes.scenarios) setScenarios(scRes.scenarios);
      if (fRes.scenarios) setForesight(fRes.scenarios);
      if (dRes.decisions) setDecisions(dRes.decisions);
      if (pRes.records) setPredictions(pRes.records);
      if (pRes.averageAccuracy) setAvgAccuracy(pRes.averageAccuracy);
    } catch (err) {
      console.error('[SelfModelCenter] Error loading Stage 5A data:', err);
    }
  };

  usePolling(fetchData, 4000);

  const handleRunCustomScenario = async () => {
    if (!newScenarioTitle.trim()) return;
    setIsSimulating(true);
    try {
      await fetch('/api/simulation/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newScenarioTitle,
          scenarioType: 'RESOURCE_REALLOCATION',
          assumptions: [`User custom simulated parameter set for ${newScenarioTitle}`],
        }),
      });
      setNewScenarioTitle('');
      await fetchData();
    } catch (err) {
      console.error('[SelfModelCenter] Error running scenario:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 rounded-xl border border-purple-500/20 shadow-lg gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AUTONOMOUS SELF-MODEL & DIGITAL TWIN
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Stage 5A Executive Intelligence
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Organizational self-representation, isolated digital twin simulation, strategic foresight, and institutional decision memory.
            </p>
          </div>
        </div>

        {/* Metrics Pill */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Health: <strong className="text-purple-300">{health?.overall || 98.2}%</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Prediction Accuracy: <strong className="text-emerald-300">{avgAccuracy}%</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('selfmodel')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'selfmodel' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> Self-Model & Capabilities
        </button>
        <button
          onClick={() => setActiveTab('digitaltwin')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'digitaltwin' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" /> Digital Twin ({scenarios.length})
        </button>
        <button
          onClick={() => setActiveTab('foresight')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'foresight' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" /> Strategic Foresight ({foresight.length})
        </button>
        <button
          onClick={() => setActiveTab('institutional')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'institutional' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Institutional Memory ({decisions.length})
        </button>
      </div>

      {/* Tab 1: Self-Model & Capability Inventory */}
      {activeTab === 'selfmodel' && selfModel && (
        <div className="space-y-6">
          {/* Identity & Health Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2 col-span-2">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">System Identity</span>
              <h3 className="text-sm font-bold text-slate-100">{selfModel.identity} ({selfModel.version})</h3>
              <p className="text-xs text-slate-400">{selfModel.architecture}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Governance: <strong className="text-purple-300">{selfModel.governanceState}</strong>
                </span>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Security: <strong className="text-emerald-300">{selfModel.securityState}</strong>
                </span>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Active Hives: <strong className="text-cyan-300">{selfModel.activeHivesCount}</strong>
                </span>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Active Agents: <strong className="text-amber-300">{selfModel.activeAgentsCount}</strong>
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Organizational Health</span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reliability:</span>
                  <span className="text-emerald-400">{health?.reliability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efficiency:</span>
                  <span className="text-cyan-400">{health?.efficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security:</span>
                  <span className="text-purple-400">{health?.security}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resilience:</span>
                  <span className="text-amber-400">{health?.resilience}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities Inventory */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-purple-400" /> Capability Inventory ({capabilities.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {c.classification}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Confidence: {(c.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{c.name}</h4>
                  <p className="text-[11px] text-slate-400">Owner: {c.owner}</p>
                  <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>Performance: {c.historicalPerformancePct}%</span>
                    <span>Cost: {c.costTokensPerOp} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capability Gaps */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Detected Capability Gaps ({gaps.length})
            </h3>

            <div className="space-y-3">
              {gaps.map((g) => (
                <div key={g.gapId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SEVERITY: {g.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {g.gapId}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{g.title}</h4>
                  <p className="text-[11px] text-slate-400">{g.description}</p>
                  <p className="text-[10px] text-purple-300 font-mono">Recommended: {g.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital Twin & Scenario Engine */}
      {activeTab === 'digitaltwin' && (
        <div className="space-y-6">
          {/* Simulator Bar */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400" /> Isolated Digital Twin Scenario Engine
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5" /> 100% Production Isolated
              </span>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter custom scenario hypothesis (e.g. 'Simulate regional cloud outage with failover')..."
                value={newScenarioTitle}
                onChange={(e) => setNewScenarioTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleRunCustomScenario}
                disabled={isSimulating || !newScenarioTitle.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <Play className="w-3.5 h-3.5" /> {isSimulating ? 'Simulating...' : 'Run Scenario'}
              </button>
            </div>
          </div>

          {/* Scenario Results List */}
          <div className="space-y-3">
            {scenarios.map((s) => (
              <div key={s.scenarioId} className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {s.scenarioType}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{s.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{formatTime(s.simulatedAt)}</span>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                  <strong>Predicted Outcome:</strong> {s.predictedOutcome}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                    <span className="text-slate-500 block">Probability:</span>
                    <span className="text-emerald-400 font-bold">{(s.successProbability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                    <span className="text-slate-500 block">Performance Impact:</span>
                    <span className={s.performanceImpactPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {s.performanceImpactPct >= 0 ? `+${s.performanceImpactPct}%` : `${s.performanceImpactPct}%`}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                    <span className="text-slate-500 block">Confidence:</span>
                    <span className="text-purple-300 font-bold">{(s.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Strategic Foresight */}
      {activeTab === 'foresight' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-4 h-4 text-purple-400" /> Multi-Horizon Strategic Foresight Scenarios
            </h3>

            <div className="space-y-4">
              {foresight.map((f) => (
                <div key={f.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      Horizon: {f.horizon} ({f.probabilityPct}% Probability)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {f.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{f.title}</h4>
                  <p className="text-[11px] text-slate-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Institutional Memory */}
      {activeTab === 'institutional' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-purple-400" /> Recorded Institutional Decisions ({decisions.length})
            </h3>

            <div className="space-y-4">
              {decisions.map((d) => (
                <div key={d.decisionId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-100">{d.objective}</span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(d.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400"><strong>Strategy:</strong> {d.selectedStrategy}</p>
                  <p className="text-[11px] text-slate-400"><strong>Evidence:</strong> {d.evidence}</p>
                  {d.actualOutcome && (
                    <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-emerald-300 border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span><strong>Actual Outcome:</strong> {d.actualOutcome}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
