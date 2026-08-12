import React, { useState } from 'react';
import { formatTime } from '../../lib/format';
import { usePolling } from '../../hooks/usePolling';
import {
  Brain,
  TrendingUp,
  Activity,
  Gauge,
  Sparkles,
  Play,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Layers,
  Award,
  Zap,
  RefreshCw,
  Compass,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { 
  PredictionRecord, 
  OutcomeRecord, 
  CausalGraph, 
  PredictionCalibration, 
  ProviderReputation, 
  CapabilityComposition,
  Stage9LearningOverview
} from '../../../shared/stage9Types';

export const Stage9CausalLearning: React.FC = () => {
  const [overview, setOverview] = useState<Stage9LearningOverview | null>(null);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [outcomes, setOutcomes] = useState<(OutcomeRecord & { 
    attribution?: any; 
    prediction?: PredictionRecord; 
    temporalObservations?: any[] 
  })[]>([]);
  const [calibration, setCalibration] = useState<PredictionCalibration | null>(null);
  const [providers, setProviders] = useState<ProviderReputation[]>([]);
  const [compositions, setCompositions] = useState<CapabilityComposition[]>([]);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  
  // Benchmark state per composition ID
  const [benchmarks, setBenchmarks] = useState<Record<string, any>>({});
  const [runningBenchmarkId, setRunningBenchmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeSection, setActiveSection] = useState<'traces' | 'reputation' | 'sandbox' | 'calibration'>('traces');

  const fetchData = async () => {
    try {
      const [overRes, predRes, outRes, calRes, provRes, compRes] = await Promise.all([
        fetch('/api/v1/learning/overview').then(r => r.json()),
        fetch('/api/v1/learning/evaluation/predictions').then(r => r.json()),
        fetch('/api/v1/learning/evaluation/outcomes').then(r => r.json()),
        fetch('/api/v1/learning/evaluation/calibration').then(r => r.json()),
        fetch('/api/v1/learning/reputation/providers').then(r => r.json()),
        fetch('/api/v1/learning/evolution/compositions').then(r => r.json())
      ]);

      setOverview(overRes);
      setPredictions(predRes.predictions || []);
      setOutcomes(outRes.outcomes || []);
      setCalibration(calRes.calibration || null);
      setProviders(provRes.providers || []);
      setCompositions(compRes.compositions || []);

      if (predRes.predictions && predRes.predictions.length > 0 && !selectedPredictionId) {
        setSelectedPredictionId(predRes.predictions[0].predictionId);
      }
    } catch (err) {
      console.error('[Stage9CausalLearning] Error loading API data:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 5000);

  const handleApplyDecay = async () => {
    try {
      const res = await fetch('/api/v1/learning/reputation/decay', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('[Stage9CausalLearning] Error applying decay:', err);
    }
  };

  const handleSimulate = async (id: string) => {
    try {
      await fetch(`/api/v1/learning/evolution/compositions/${id}/simulate`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('[Stage9CausalLearning] Error simulating composition:', err);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await fetch(`/api/v1/learning/evolution/compositions/${id}/validate`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('[Stage9CausalLearning] Error validating composition:', err);
    }
  };

  const handlePromote = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/learning/evolution/compositions/${id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizedBy: 'Executive Operator (Human Signature)' })
      });
      const data = await res.json();
      if (data.success && data.composition?.status !== 'AVAILABLE') {
        // Means blocked by governance (high risk requires signature/override)
        alert('Promotion blocked by Governance: High-Risk compositions require a structured offline key approval signature.');
      }
      await fetchData();
    } catch (err) {
      console.error('[Stage9CausalLearning] Error promoting composition:', err);
    }
  };

  const handleRestrict = async (id: string) => {
    try {
      await fetch(`/api/v1/learning/evolution/compositions/${id}/restrict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual operator constraint overlay' })
      });
      await fetchData();
    } catch (err) {
      console.error('[Stage9CausalLearning] Error restricting composition:', err);
    }
  };

  const handleRunBenchmark = async (id: string) => {
    setRunningBenchmarkId(id);
    try {
      // simulate artificial delay for awesome loading look
      await new Promise(r => setTimeout(r, 1500));
      const res = await fetch(`/api/v1/learning/evolution/compositions/${id}/benchmark`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBenchmarks(prev => ({
          ...prev,
          [id]: data.benchmark
        }));
      }
    } catch (err) {
      console.error('[Stage9CausalLearning] Error running benchmark:', err);
    } finally {
      setRunningBenchmarkId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 gap-2 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
        <span>Synchronizing Stage 9 Causal Evaluation Ledger...</span>
      </div>
    );
  }

  const selectedPrediction = predictions.find(p => p.predictionId === selectedPredictionId);
  const matchingOutcome = outcomes.find(o => o.predictionId === selectedPredictionId);

  return (
    <div className="space-y-6">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Prediction Accuracy</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {overview?.predictionAccuracy || 0}%
            </span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Calibration Error</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {overview?.calibrationError || 0}%
            </span>
          </div>
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Evolved Composites</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {overview?.capabilitiesImproved || 0} <span className="text-xs font-normal text-slate-500">active</span>
            </span>
          </div>
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Evaluations Ledged</span>
            <span className="text-2xl font-bold font-mono text-purple-400">
              {overview?.outcomesCount || 0} / {overview?.predictionsCount || 0}
            </span>
          </div>
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section Sub-Navigation */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveSection('traces')}
          className={`flex-1 md:flex-none px-4 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'traces' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Causal Traces
        </button>
        <button
          onClick={() => setActiveSection('reputation')}
          className={`flex-1 md:flex-none px-4 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'reputation' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Provider Reputations
        </button>
        <button
          onClick={() => setActiveSection('sandbox')}
          className={`flex-1 md:flex-none px-4 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'sandbox' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Capability Evolution Sandbox
        </button>
        <button
          onClick={() => setActiveSection('calibration')}
          className={`flex-1 md:flex-none px-4 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'calibration' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" /> Prediction Calibration
        </button>
      </div>

      {/* Section Content */}
      {activeSection === 'traces' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prediction List Left Column */}
          <div className="md:col-span-1 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col h-[520px]">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Predictions Log</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {predictions.map(p => {
                const match = outcomes.find(o => o.predictionId === p.predictionId);
                const hasFailure = match && match.failures.length > 0;
                return (
                  <button
                    key={p.predictionId}
                    onClick={() => setSelectedPredictionId(p.predictionId)}
                    className={`w-full p-3 rounded-lg border text-left flex flex-col gap-1.5 transition-all ${
                      selectedPredictionId === p.predictionId
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/95'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{p.predictionId}</span>
                      {match ? (
                        hasFailure ? (
                          <span className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">DEGRADED</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SUCCESS</span>
                        )
                      ) : (
                        <span className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-slate-800 text-slate-400">PENDING</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{p.expectedOutcome}</h4>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Provider: <strong>{p.provider}</strong></span>
                      <span className="text-amber-400">Conf: {Math.round(p.confidence * 100)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Causal Analysis Center Column & Right Column */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {selectedPrediction ? (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-amber-400" />
                      Prediction vs Outcome Causal Trace
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      ID: {selectedPrediction.predictionId} | Decision: {selectedPrediction.decisionId}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {new Date(selectedPrediction.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Side-by-Side Expected vs Actual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Expectations */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-500" /> Predicted expectations
                    </h4>
                    <p className="text-xs font-semibold text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800">
                      "{selectedPrediction.expectedOutcome}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                      <div>Expected Duration: <strong className="text-slate-200">{selectedPrediction.expectedDuration}ms</strong></div>
                      <div>Expected Cost: <strong className="text-slate-200">{selectedPrediction.expectedCost}t</strong></div>
                      <div>Expected Reliability: <strong className="text-slate-200">{Math.round(selectedPrediction.expectedReliability * 100)}%</strong></div>
                      <div>Expected Risk: <strong className={`text-slate-200 ${selectedPrediction.expectedRisk === 'LOW' ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedPrediction.expectedRisk}</strong></div>
                    </div>
                    {selectedPrediction.assumptions.length > 0 && (
                      <div className="text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                        <span className="text-slate-500 block uppercase font-bold text-[8px]">Assumptions:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                          {selectedPrediction.assumptions.map((a, idx) => <li key={idx} className="truncate">{a}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right: Actual Outcomes */}
                  {matchingOutcome ? (
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-500" /> Observed Outcome
                      </h4>
                      <p className="text-xs font-semibold text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800">
                        "{matchingOutcome.actualResult}"
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                        <div>Actual Duration: <strong className={`font-bold ${matchingOutcome.actualDuration > selectedPrediction.expectedDuration * 1.5 ? 'text-rose-400' : 'text-slate-200'}`}>{matchingOutcome.actualDuration}ms</strong></div>
                        <div>Actual Cost: <strong className="text-slate-200">{matchingOutcome.actualCost}t</strong></div>
                        <div>Actual Reliability: <strong className="text-slate-200">{Math.round(matchingOutcome.actualReliability * 100)}%</strong></div>
                        <div>Failures: <strong className={matchingOutcome.failures.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>{matchingOutcome.failures.length}</strong></div>
                      </div>
                      {matchingOutcome.verificationResults.length > 0 && (
                        <div className="text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                          <span className="text-slate-500 block uppercase font-bold text-[8px]">Verification Outcomes:</span>
                          <div className="text-slate-300">
                            {matchingOutcome.verificationResults.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900/20 rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500 h-full min-h-[160px]">
                      <Clock className="w-8 h-8 mb-2 animate-pulse text-slate-600" />
                      <span className="text-xs">Waiting for external observation outcome...</span>
                    </div>
                  )}
                </div>

                {/* Temporal Logs & Causal Attribution Details */}
                {matchingOutcome && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                    {/* Left: Temporal Observations */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Temporal Observations</h4>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {matchingOutcome.temporalObservations && matchingOutcome.temporalObservations.length > 0 ? (
                          matchingOutcome.temporalObservations.map((obs, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] flex justify-between gap-2">
                              <div>
                                <span className="px-1 py-0.5 text-[8px] font-mono rounded bg-slate-800 text-slate-400 mr-2 uppercase">{obs.timeframe}</span>
                                <span className="text-slate-300">{obs.observation}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-600 text-[11px] italic">No temporal observations.</div>
                        )}
                      </div>
                    </div>

                    {/* Right: Causal Attribution */}
                    {matchingOutcome.attribution && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Causal Attribution Analysis</h4>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Primary Cause:</span>
                            <span className="text-[10px] font-mono text-amber-400">Confidence: {Math.round(matchingOutcome.attribution.confidence * 100)}%</span>
                          </div>
                          <p className="text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono">
                            {matchingOutcome.attribution.primaryCause}
                          </p>
                          {matchingOutcome.attribution.contributingFactors.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-500 block uppercase">Contributing Factors:</span>
                              <div className="space-y-1 text-[11px] font-mono">
                                {matchingOutcome.attribution.contributingFactors.map((f: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-slate-400 bg-slate-950/40 px-2 py-0.5 rounded">
                                    <span>{f.factor}</span>
                                    <span className="text-cyan-400">+{Math.round(f.influence * 100)}% influence</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                <Compass className="w-12 h-12 mb-2 text-slate-700 animate-pulse" />
                <span>Select a prediction trace from the left panel to inspect the causal learning chain.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Reputations Section */}
      {activeSection === 'reputation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Active Provider Trust & Reputation Profiles</h3>
            <button
              onClick={handleApplyDecay}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-amber-500 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Trigger Reputation Decay
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {providers.map(p => {
              const score = Math.round(p.reliability * 100);
              const isBad = score < 85;
              return (
                <div key={p.provider} className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{p.provider}</h4>
                      <span className="text-[10px] font-mono text-slate-500">Evaluated: {formatTime(p.lastEvaluatedAt)}</span>
                    </div>
                    <div className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg ${
                      isBad ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      TRUST: {score}%
                    </div>
                  </div>

                  {/* Meter */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className={`h-full transition-all ${isBad ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${score}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <strong className="text-slate-200">{Math.round(p.latency)}ms</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Accuracy:</span>
                      <strong className="text-slate-200">{Math.round(p.costAccuracy * 100)}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Rating:</span>
                      <strong className="text-slate-200">{Math.round(p.quality * 100)}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Failure Rate:</span>
                      <strong className={`font-bold ${p.failureRate > 0.08 ? 'text-rose-400' : 'text-slate-200'}`}>{(p.failureRate * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prediction Calib:</span>
                      <strong className="text-slate-200">{p.predictionAccuracyPct}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <strong className="text-slate-200">{p.verificationSuccessPct}%</strong>
                    </div>
                  </div>

                  {p.environmentalSensitivity.length > 0 && (
                    <div className="text-[10px] font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-amber-500 block uppercase font-bold text-[8px]">Context Sensitivity:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {p.environmentalSensitivity.map((e, idx) => <li key={idx} className="truncate">{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {p.securityHistory.length > 0 && (
                    <div className="text-[10px] font-mono bg-rose-950/10 p-2 rounded-lg border border-rose-500/20 space-y-1 text-rose-300">
                      <span className="text-rose-400 block uppercase font-bold text-[8px] flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Security Incidents:
                      </span>
                      {p.securityHistory.map((s, idx) => <div key={idx} className="truncate">{s}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Capability Evolution Sandbox */}
      {activeSection === 'sandbox' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Evolved Composite Capabilities Sandbox
                </h3>
                <p className="text-xs text-slate-400">
                  Compose individual atomic web actions into robust transaction pipelines. Simulate under synthetic noise, benchmark performance, and promote via human governance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {compositions.map(c => {
                const bm = benchmarks[c.compositionId];
                const isRunning = runningBenchmarkId === c.compositionId;
                const isHighRisk = c.expectedRisk === 'HIGH' || c.expectedRisk === 'CRITICAL';
                return (
                  <div key={c.compositionId} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                          c.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          c.status === 'VALIDATED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          c.status === 'SIMULATED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase flex items-center gap-1 ${
                          isHighRisk ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isHighRisk && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                          Risk: {c.expectedRisk}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{c.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{c.purpose}</p>
                      </div>

                      <div className="text-[10px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5 text-slate-400">
                        <div>Component Actions: <strong className="text-slate-200">{c.componentCapabilities.join(' → ')}</strong></div>
                        <div>Benefit: <strong className="text-cyan-400">{c.expectedBenefit}</strong></div>
                        <div>Rollback Plan: <strong className="text-rose-300">{c.rollbackStrategy}</strong></div>
                      </div>
                    </div>

                    {/* Interactive Benchmarking Panel */}
                    {bm && (
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-400">
                        <div className="text-xs text-amber-400 font-bold border-b border-slate-800/80 pb-1 flex justify-between">
                          <span>A/B Benchmark Results</span>
                          <span className={bm.improvementDetected ? 'text-emerald-400' : 'text-rose-400'}>
                            {bm.improvementDetected ? '✔ Improvement Verified' : '✘ No Improvement Detected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Composite Latency: <strong className="text-slate-200">{bm.compositeLatency}ms</strong></span>
                          <span>Baseline Latency: <strong className="text-slate-400">{bm.baselineLatency}ms</strong></span>
                        </div>
                        <div className="flex justify-between">
                          <span>Composite Success: <strong className="text-slate-200">{bm.compositeSuccessPct}%</strong></span>
                          <span>Baseline Success: <strong className="text-slate-400">{bm.baselineSuccessPct}%</strong></span>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Consolidated via 50 synthetic test iterations. Cost delta: +{bm.costDeltaPct}%
                        </div>
                      </div>
                    )}

                    {/* Interactive Sandbox Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-850/80">
                      {c.status === 'PROPOSED' && (
                        <button
                          onClick={() => handleSimulate(c.compositionId)}
                          className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Run Simulated Trace
                        </button>
                      )}
                      {c.status === 'SIMULATED' && (
                        <button
                          onClick={() => handleValidate(c.compositionId)}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <ShieldCheck className="w-3 h-3" /> Run Sandbox Validation
                        </button>
                      )}
                      {(c.status === 'VALIDATED' || c.status === 'SIMULATED') && (
                        <button
                          onClick={() => handleRunBenchmark(c.compositionId)}
                          disabled={isRunning}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin text-amber-500' : ''}`} />
                          {isRunning ? 'Benchmarking...' : 'A/B Benchmark'}
                        </button>
                      )}
                      {c.status === 'VALIDATED' && (
                        <button
                          onClick={() => handlePromote(c.compositionId)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <ShieldCheck className="w-3 h-3" /> Promote to Active
                        </button>
                      )}
                      {c.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleRestrict(c.compositionId)}
                          className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <AlertTriangle className="w-3 h-3" /> Restrict/Rollback
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Prediction Calibration Curve Analysis */}
      {activeSection === 'calibration' && calibration && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              Confidence Calibration Bin Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Calibration measures how closely the Hive's confidence ratings predict actual success frequencies. True calibration means if confidence is 80%, 8 out of 10 executions must succeed.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-5 text-[10px] font-mono text-slate-500 border-b border-slate-850 pb-2 uppercase font-bold">
                <span>Confidence Bin</span>
                <span>Expected Success</span>
                <span>Observed Success</span>
                <span>Sample Count</span>
                <span className="text-right">Calibration Error</span>
              </div>
              {calibration.buckets.map(b => (
                <div key={b.confidenceBin} className="grid grid-cols-5 text-xs font-mono text-slate-300 border-b border-slate-900 pb-2">
                  <span>{Math.round(b.confidenceBin * 100)}%</span>
                  <span>{b.expectedSuccessRate}%</span>
                  <span className={Math.abs(b.expectedSuccessRate - b.observedSuccessRate) > 15 ? 'text-amber-400' : 'text-emerald-400'}>
                    {Math.round(b.observedSuccessRate)}%
                  </span>
                  <span>{b.sampleSize}</span>
                  <span className={`text-right font-bold ${b.calibrationError > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Math.round(b.calibrationError)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Confidence Context Attribution</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Calibration by Capability</span>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(calibration.confidenceByCapability).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-300 bg-slate-900 p-2 rounded">
                      <span>{k}</span>
                      <strong className="text-cyan-400">{(v as number) * 100}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Calibration by Provider</span>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(calibration.confidenceByProvider).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-300 bg-slate-900 p-2 rounded">
                      <span>{k}</span>
                      <strong className="text-amber-400">{(v as number) * 100}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Calibration by Queue Load</span>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(calibration.confidenceByContext).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-300 bg-slate-900 p-2 rounded">
                      <span>{k}</span>
                      <strong className="text-purple-400">{(v as number) * 100}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
