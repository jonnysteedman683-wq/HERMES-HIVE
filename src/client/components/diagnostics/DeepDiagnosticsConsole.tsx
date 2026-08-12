import React, { useState, useEffect } from 'react';
import {
  CausalTraceSpan,
  SystemStateSnapshot,
  RootCauseAnalysisReport,
  SelfRepairProposal,
  WhyExplanationReport,
  IncidentRecord,
} from '../../../shared/types';
import {
  Search,
  Activity,
  History,
  GitCommit,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  HelpCircle,
  Zap,
  Terminal,
  Bug,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const DeepDiagnosticsConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'traces' | 'snapshots' | 'rootcause' | 'repairs' | 'why' | 'chaos'>('traces');

  const [traces, setTraces] = useState<CausalTraceSpan[]>([]);
  const [snapshots, setSnapshots] = useState<SystemStateSnapshot[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [proposals, setProposals] = useState<SelfRepairProposal[]>([]);
  const [whyQuery, setWhyQuery] = useState('Why did mission fail during execution?');
  const [whyReport, setWhyReport] = useState<WhyExplanationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTraces = async () => {
    try {
      const res = await fetch('/api/v1/diagnostics/causal-traces');
      if (res.ok) {
        const data = await res.json();
        setTraces(data.traces || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await fetch('/api/v1/diagnostics/snapshots');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIncidentsAndProposals = async () => {
    try {
      const [resInc, resProp] = await Promise.all([
        fetch('/api/v1/diagnostics/incidents'),
        fetch('/api/v1/diagnostics/repairs'),
      ]);
      if (resInc.ok) {
        const d = await resInc.json();
        setIncidents(d.incidents || []);
      }
      if (resProp.ok) {
        const d = await resProp.json();
        setProposals(d.proposals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTraces();
    fetchSnapshots();
    fetchIncidentsAndProposals();
  }, []);

  /** POST a diagnostics action with the shared loading/try-finally wrapper; returns the response. */
  const runAction = async (url: string, body?: unknown): Promise<Response | null> => {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        ...(body !== undefined
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          : {}),
      });
      if (!res.ok) {
        // Surface HTTP failures — silent no-ops in a diagnostics console hide
        // exactly the failures the operator is here to see.
        setStatusMessage(`Action failed (HTTP ${res.status}): ${url}`);
        return null;
      }
      return res;
    } catch (err) {
      // Surface network failures instead of letting the rejection escape the
      // event handler as an unhandled rejection.
      setStatusMessage(`Action failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSnapshot = async () => {
    const res = await runAction('/api/v1/diagnostics/snapshots/take', { reason: 'Manual Operator Checkpoint' });
    if (res?.ok) {
      setStatusMessage('New state snapshot recorded.');
      fetchSnapshots();
    }
  };

  const handleWhyQuery = async () => {
    if (!whyQuery.trim()) return;
    const res = await runAction('/api/v1/diagnostics/why', { query: whyQuery });
    if (res?.ok) {
      const d = await res.json();
      setWhyReport(d.report);
    }
  };

  const handleApproveRepair = async (proposalId: string) => {
    const res = await runAction(`/api/v1/diagnostics/repairs/${proposalId}/approve`, { approvedBy: 'Executive Operator' });
    if (res?.ok) {
      setStatusMessage(`Repair ${proposalId} approved.`);
      fetchIncidentsAndProposals();
    }
  };

  const handleApplyRepair = async (proposalId: string) => {
    const res = await runAction(`/api/v1/diagnostics/repairs/${proposalId}/apply`);
    if (res?.ok) {
      setStatusMessage(`Repair ${proposalId} applied.`);
      fetchIncidentsAndProposals();
    }
  };

  const handleRollbackRepair = async (proposalId: string) => {
    const res = await runAction(`/api/v1/diagnostics/repairs/${proposalId}/rollback`);
    if (res?.ok) {
      setStatusMessage(`Repair ${proposalId} rolled back.`);
      fetchIncidentsAndProposals();
    }
  };

  const handleChaosInjection = async (scenarioType: string) => {
    const res = await runAction('/api/v1/diagnostics/chaos', { scenarioType });
    if (res?.ok) {
      setStatusMessage(`Chaos scenario '${scenarioType}' injected.`);
      fetchTraces();
      fetchIncidentsAndProposals();
    }
  };

  return (
    <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-cyan-400" /> STAGE 8.5 — DEEP DEBUGGING & GOVERNED SELF-REPAIR
          </h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Distributed Causal Graph • Root Cause Multi-Hypothesis Analysis • Governed Self-Repair • Operator "Why?" Engine
          </p>
        </div>

        {statusMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {statusMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('traces')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'traces'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" /> Causal Traces ({traces.length})
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'snapshots'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" /> State Snapshots ({snapshots.length})
        </button>

        <button
          onClick={() => setActiveTab('rootcause')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'rootcause'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Root Cause Analysis ({incidents.length})
        </button>

        <button
          onClick={() => setActiveTab('repairs')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'repairs'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Governed Self-Repairs ({proposals.length})
        </button>

        <button
          onClick={() => setActiveTab('why')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'why'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> "Why?" Explanation Engine
        </button>

        <button
          onClick={() => setActiveTab('chaos')}
          className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'chaos'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Chaos Testing Sandbox
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'traces' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-200 font-bold">Distributed Causal Trace Ledger</h3>
            <button
              onClick={fetchTraces}
              className="px-3 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
            >
              Refresh Spans
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {traces.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No causal trace spans recorded yet.</div>
            ) : (
              traces.map((span) => (
                <div
                  key={span.spanId}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-cyan-400">
                      [{span.component}] {span.action}
                    </span>
                    <span className="text-slate-500 text-[10px]">{span.timestamp}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-400 text-[10px]">
                    <span>Trace ID: <strong className="text-slate-200">{span.traceId}</strong></span>
                    <span>Actor: <strong className="text-slate-200">{span.actor}</strong></span>
                    <span>Causality: <strong className="text-amber-400">{span.causality}</strong></span>
                    <span>Duration: <strong className="text-slate-200">{span.durationMs}ms</strong></span>
                    <span>
                      Status:{' '}
                      <strong className={span.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                        {span.status}
                      </strong>
                    </span>
                  </div>
                  {span.error && (
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[10px]">
                      Error: {span.error.message} ({span.error.category})
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-200 font-bold">System State Snapshots & Time Travel</h3>
            <button
              onClick={handleTakeSnapshot}
              disabled={loading}
              className="px-3 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-800 hover:bg-purple-800"
            >
              + Take Checkpoint Snapshot
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {snapshots.map((snap) => (
              <div key={snap.snapshotId} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex justify-between font-bold text-purple-300">
                  <span>{snap.snapshotId}</span>
                  <span className="text-slate-500 text-[10px]">{snap.timestamp}</span>
                </div>
                <div className="text-slate-300 text-[10px]">Reason: {snap.triggerReason}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[10px]">
                  <div>Active Agents: <strong className="text-slate-200">{snap.activeAgentsCount}</strong></div>
                  <div>Active Missions: <strong className="text-slate-200">{snap.activeMissionsCount}</strong></div>
                  <div>World Entities: <strong className="text-slate-200">{snap.worldEntitiesCount}</strong></div>
                  <div>Memory Records: <strong className="text-slate-200">{snap.memoryStats.totalRecords}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rootcause' && (
        <div className="space-y-4">
          <h3 className="text-slate-200 font-bold">Root Cause Analysis & Incident Memory</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {incidents.map((inc) => (
              <div key={inc.incidentId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">{inc.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800">
                    {inc.category}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">Fingerprint: {inc.fingerprint}</p>

                {inc.rootCauseReport && (
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5 text-[10px]">
                    <div className="font-bold text-slate-300">Multi-Hypothesis Root Cause Evaluation:</div>
                    {inc.rootCauseReport.rootCauseHypotheses.map((h) => (
                      <div key={h.hypothesisId} className="flex items-start justify-between text-slate-400">
                        <span>• {h.title}: {h.description}</span>
                        <strong className="text-cyan-400 font-mono">{h.confidencePct}% Confidence</strong>
                      </div>
                    ))}
                    <div className="mt-2 text-slate-300">
                      Blast Radius: <strong className="text-rose-400">{inc.rootCauseReport.blastRadius.estimatedSeverity}</strong> ({inc.rootCauseReport.blastRadius.description})
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'repairs' && (
        <div className="space-y-4">
          <h3 className="text-slate-200 font-bold">Governed Self-Repair Control Plane</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {proposals.map((p) => (
              <div key={p.proposalId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">{p.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    p.status === 'APPLIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : p.status === 'APPROVED'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">{p.description}</p>
                <div className="text-slate-400 text-[10px]">
                  Simulation Result: <strong className="text-emerald-300">{p.simulationResult.simulatedImpact}</strong> ({p.simulationResult.predictedRecoveryPct}% Predicted Recovery)
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {p.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleApproveRepair(p.proposalId)}
                      disabled={loading}
                      className="px-3 py-1 rounded bg-blue-900/60 text-blue-200 border border-blue-800 hover:bg-blue-800 text-[10px]"
                    >
                      Governance Approve
                    </button>
                  )}
                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => handleApplyRepair(p.proposalId)}
                      disabled={loading}
                      className="px-3 py-1 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-800 hover:bg-emerald-800 text-[10px]"
                    >
                      Apply Self-Repair
                    </button>
                  )}
                  {p.status === 'APPLIED' && (
                    <button
                      onClick={() => handleRollbackRepair(p.proposalId)}
                      disabled={loading}
                      className="px-3 py-1 rounded bg-rose-900/60 text-rose-200 border border-rose-800 hover:bg-rose-800 text-[10px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Execute Rollback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'why' && (
        <div className="space-y-4">
          <h3 className="text-slate-200 font-bold">Operator "Why?" Explanation Engine</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={whyQuery}
              onChange={(e) => setWhyQuery(e.target.value)}
              placeholder="e.g. Why did mission X fail? Why didn't Hermes execute capability Y?"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleWhyQuery}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-800 font-bold text-xs flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> Explain
            </button>
          </div>

          {whyReport && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="text-cyan-300 font-bold text-xs">{whyReport.summaryExplanation}</div>
              <div className="space-y-1.5 text-slate-300 text-[11px]">
                {whyReport.objectiveContext && (
                  <div>Objective Context: <strong className="text-slate-100">{whyReport.objectiveContext}</strong></div>
                )}
                {whyReport.reasoningFactors && (
                  <div>
                    <span className="font-bold text-slate-400">Reasoning Factors:</span>
                    <ul className="list-disc list-inside text-slate-400 text-[10px] pl-2 mt-0.5 space-y-0.5">
                      {whyReport.reasoningFactors.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {whyReport.governanceConstraints && (
                  <div>
                    <span className="font-bold text-slate-400">Governance Constraints:</span>
                    <ul className="list-disc list-inside text-slate-400 text-[10px] pl-2 mt-0.5 space-y-0.5">
                      {whyReport.governanceConstraints.map((gc, i) => (
                        <li key={i}>{gc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {whyReport.rootCauseDetails && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60 text-amber-300 text-[10px]">
                    Root Cause: {whyReport.rootCauseDetails}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chaos' && (
        <div className="space-y-4">
          <h3 className="text-slate-200 font-bold">Chaos Testing & Resilience Verification</h3>
          <p className="text-slate-400 text-[11px]">
            Simulate controlled failure scenarios across Hermes Hive ↔ Hermes Web boundary to verify automated root cause analysis and self-repair proposals.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleChaosInjection('HERMES_WEB_OUTAGE')}
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-left space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Inject Hermes Web Outage
              </div>
              <div className="text-[10px] text-slate-400">Simulates complete bridge connectivity loss</div>
            </button>

            <button
              onClick={() => handleChaosInjection('INCORRECT_CAPABILITY_DATA')}
              className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 hover:bg-amber-900/60 text-amber-300 text-left space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Inject Capability Malformed Response
              </div>
              <div className="text-[10px] text-slate-400">Simulates data payload error</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
