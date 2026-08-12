import React, { useState } from 'react';
import { formatTime } from '../../lib/format';
import { usePolling } from '../../hooks/usePolling';
import {
  Network,
  Cpu,
  Coins,
  Compass,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Terminal,
  Activity,
  Layers,
  Zap,
  Globe,
  Plus,
  HelpCircle,
  ArrowRightLeft,
  Workflow,
  Search,
  ShieldCheck,
  Send
} from 'lucide-react';
import {
  SymbiontHive,
  RecombinantMutation,
  SymbiosisSession,
  HolographicNode,
  SuperHologram,
  Stage10SymbiosisOverview,
  RiskLevel
} from '../../../shared/stage10Types';

export const Stage10Symbiosis: React.FC = () => {
  const [overview, setOverview] = useState<Stage10SymbiosisOverview | null>(null);
  const [hives, setHives] = useState<SymbiontHive[]>([]);
  const [mutations, setMutations] = useState<RecombinantMutation[]>([]);
  const [sessions, setSessions] = useState<SymbiosisSession[]>([]);
  const [hologram, setHologram] = useState<SuperHologram | null>(null);
  const [treasuryLedger, setTreasuryLedger] = useState<any>(null);

  const [activeSection, setActiveSection] = useState<'network' | 'recombinant' | 'consensus' | 'hologram'>('network');
  const [loading, setLoading] = useState<boolean>(true);

  // Forms and Interactivity state
  const [sourceHiveId, setSourceHiveId] = useState<string>('hive-prime');
  const [destHiveId, setDestHiveId] = useState<string>('hive-gaia');
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [transferPurpose, setTransferPurpose] = useState<string>('Dynamic load balancing compensation');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);

  // New Mutation Form State
  const [showMutationForm, setShowMutationForm] = useState<boolean>(false);
  const [newMutProposedBy, setNewMutProposedBy] = useState<string>('hive-prime');
  const [newMutComponent, setNewMutComponent] = useState<string>('Scheduler');
  const [newMutTarget, setNewMutTarget] = useState<string>('Concurrency Queue Throttle');
  const [newMutRemoved, setNewMutRemoved] = useState<string>('threads.map(t => t.execute());');
  const [newMutAdded, setNewMutAdded] = useState<string>('if (queueDepth > 15) {\n  threads.slice(0, 8).map(t => t.execute());\n  yield wait(50);\n} else {\n  threads.map(t => t.execute());\n}');
  const [newMutGainEff, setNewMutGainEff] = useState<number>(12.5);
  const [newMutGainRel, setNewMutGainRel] = useState<number>(8.0);
  const [newMutRisk, setNewMutRisk] = useState<RiskLevel>('LOW');

  // Interactive sandbox logs panel
  const [selectedMutationId, setSelectedMutationId] = useState<string | null>(null);
  const [authorizedBy, setAuthorizedBy] = useState<string>('Operator');

  // New Session Form State
  const [showSessionForm, setShowSessionForm] = useState<boolean>(false);
  const [newSessTitle, setNewSessTitle] = useState<string>('Cross-Hive Memory Fusion Sync');
  const [newSessParticipants, setNewSessParticipants] = useState<string[]>(['Hive Prime', 'Hive Nexus']);
  const [newSessObjective, setNewSessObjective] = useState<string>('Align semantic schemas across prime database cores.');
  const [newSessCompute, setNewSessCompute] = useState<number>(1500);

  // New Holographic Node Form State
  const [showNodeForm, setShowNodeForm] = useState<boolean>(false);
  const [newNodeLabel, setNewNodeLabel] = useState<string>('Quantum Key Agreement Proof');
  const [newNodeInsight, setNewNodeInsight] = useState<string>('Pre-emptively negotiating lattice-based security frames guarantees zero-trust communications.');
  const [newNodeSource, setNewNodeSource] = useState<string>('Hive Nexus');
  const [newNodeImportance, setNewNodeImportance] = useState<number>(0.92);
  const [newNodeConnections, setNewNodeConnections] = useState<string[]>([]);
  const [newNodeX, setNewNodeX] = useState<number>(0.5);
  const [newNodeY, setNewNodeY] = useState<number>(0.5);

  // Connection selection state
  const [connectNode1, setConnectNode1] = useState<string>('');
  const [connectNode2, setConnectNode2] = useState<string>('');

  const fetchData = async () => {
    try {
      const [overRes, hivesRes, mutsRes, sessRes, holoRes, tresRes] = await Promise.all([
        fetch('/api/v1/symbiosis/overview').then(r => r.json()),
        fetch('/api/v1/symbiosis/hives').then(r => r.json()),
        fetch('/api/v1/symbiosis/mutations').then(r => r.json()),
        fetch('/api/v1/symbiosis/sessions').then(r => r.json()),
        fetch('/api/v1/symbiosis/hologram').then(r => r.json()),
        fetch('/api/v1/symbiosis/treasury').then(r => r.json())
      ]);

      setOverview(overRes.overview);
      setHives(hivesRes.hives || []);
      setMutations(mutsRes.mutations || []);
      setSessions(sessRes.sessions || []);
      setHologram(holoRes.hologram || null);
      setTreasuryLedger(tresRes.ledger || null);

      if (mutsRes.mutations && mutsRes.mutations.length > 0 && !selectedMutationId) {
        setSelectedMutationId(mutsRes.mutations[0].mutationId);
      }
    } catch (err) {
      console.error('[Stage10Symbiosis] Error fetching API data:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 4000);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess(false);

    if (sourceHiveId === destHiveId) {
      setTransferError('Source and destination Hives must be different.');
      return;
    }

    try {
      const res = await fetch('/api/v1/symbiosis/treasury/redistribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromHiveId: sourceHiveId,
          toHiveId: destHiveId,
          amount: Number(transferAmount),
          purpose: transferPurpose
        })
      });

      const data = await res.json();
      if (data.success) {
        setTransferSuccess(true);
        setTreasuryLedger(data.ledger);
        setHives(data.hives);
        await fetchData();
      } else {
        setTransferError('Failed to transfer tokens. Verify source balance and permissions.');
      }
    } catch (err) {
      setTransferError('Server connection issue during redistribution.');
    }
  };

  const handleProposeMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/symbiosis/mutations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedBy: newMutProposedBy,
          componentAffected: newMutComponent,
          mutationTarget: newMutTarget,
          heuristicDiff: {
            removed: newMutRemoved,
            added: newMutAdded
          },
          expectedEfficiencyGainPct: Number(newMutGainEff),
          expectedReliabilityGainPct: Number(newMutGainRel),
          riskLevel: newMutRisk
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedMutationId(data.mutation.mutationId);
        setShowMutationForm(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error proposing mutation:', err);
    }
  };

  const handleRunSandbox = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/symbiosis/mutations/${id}/sandbox`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error simulating sandbox:', err);
    }
  };

  const handleSynthesizeDeploy = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/symbiosis/mutations/${id}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizedBy })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error deploying mutation:', err);
    }
  };

  const handleRestrict = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/symbiosis/mutations/${id}/restrict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Operator manual override' })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error restricting mutation:', err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/symbiosis/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessTitle,
          participantHives: newSessParticipants,
          objective: newSessObjective,
          computeAllocated: Number(newSessCompute)
        })
      });

      if (res.ok) {
        setShowSessionForm(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error proposing session:', err);
    }
  };

  const handleAdvanceSession = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/symbiosis/sessions/${id}/collaborate`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error advancing session:', err);
    }
  };

  const handleAddHoloNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/symbiosis/hologram/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newNodeLabel,
          dimensionVector: [Number(newNodeX), Number(newNodeY), Math.random(), Math.random(), Math.random()],
          associatedInsight: newNodeInsight,
          sourceHive: newNodeSource,
          importanceScore: Number(newNodeImportance),
          connections: newNodeConnections
        })
      });

      if (res.ok) {
        setShowNodeForm(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error adding holographic node:', err);
    }
  };

  const handleConnectHoloNodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectNode1 || !connectNode2 || connectNode1 === connectNode2) return;

    try {
      const res = await fetch('/api/v1/symbiosis/hologram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId1: connectNode1,
          nodeId2: connectNode2
        })
      });

      if (res.ok) {
        setConnectNode1('');
        setConnectNode2('');
        await fetchData();
      }
    } catch (err) {
      console.error('Error establishing holographic connection:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-4">
        <Cpu className="w-12 h-12 animate-spin text-purple-500" />
        <p className="text-sm tracking-wider font-mono">Consolidating Stage 10 Symbiont State Registers...</p>
      </div>
    );
  }

  const activeMutation = mutations.find(m => m.mutationId === selectedMutationId);

  return (
    <div id="stage10-symbiosis-root" className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold tracking-widest uppercase bg-purple-900 text-purple-300 rounded font-mono">
              Stage 10 Core
            </span>
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
            RECURSIVE HYPER-EVOLUTION & SYMBIONT NETWORK
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Hermes Hive achieves closed-loop recursive self-improvement. Share mutated heuristic instruction sets, collaborate on deep semantic consensus, and reallocate compute tokens decetraly.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 self-stretch md:self-auto justify-center">
          <Activity className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-slate-300 font-mono">Symbiotic State Synchronization Active</span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Online Hives</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-white">{overview.totalOnlineHives}</span>
              <span className="text-xs text-emerald-500">/ 5</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(overview.totalOnlineHives / 5) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Active Sessions</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-white">{overview.activeSymbiosisSessions}</span>
              <span className="text-xs text-purple-400">running</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: `${overview.activeSymbiosisSessions > 0 ? 75 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Mutations Swapped</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-white">{overview.mutationsDeployedCount}</span>
              <span className="text-xs text-blue-400">active</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">System Entropy</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-white">{overview.overallSystemEntropy}%</span>
              <span className="text-xs text-emerald-400">optimized</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: `${100 - overview.overallSystemEntropy}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Alignment Affinity</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-white">{overview.globalConsciousnessAlignment}%</span>
              <span className="text-xs text-indigo-400">unified</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: `${overview.globalConsciousnessAlignment}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Treasury Capacity</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-amber-400">{overview.symbioticTreasuryTotal}</span>
              <span className="text-xs text-amber-500">T</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-850 bg-slate-950 p-1.5 rounded-lg">
        <button
          onClick={() => setActiveSection('network')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSection === 'network'
              ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-4 h-4" />
          Symbiont Hive Graph
        </button>
        <button
          onClick={() => setActiveSection('recombinant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSection === 'recombinant'
              ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Recombinant Mutations
        </button>
        <button
          onClick={() => setActiveSection('consensus')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSection === 'consensus'
              ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Consensus Sessions
        </button>
        <button
          onClick={() => setActiveSection('hologram')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSection === 'hologram'
              ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          Holographic Insights Map
        </button>
      </div>

      {/* Tab 1: Symbiont Hive Network */}
      {activeSection === 'network' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">Active Symbiont Nodes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hives.map(hive => (
                  <div
                    key={hive.hiveId}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-200 relative group"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        hive.status === 'ONLINE' ? 'bg-emerald-500' : hive.status === 'SYNCHRONIZING' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                      }`}></span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{hive.status}</span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-purple-400 border border-slate-800 rounded">
                      {hive.specialization}
                    </span>

                    <h4 className="text-lg font-black text-white mt-3">{hive.name}</h4>
                    <p className="text-slate-500 text-xs font-mono mt-1">Core: {hive.version}</p>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-850">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Reputation</span>
                        <strong className="text-white text-sm font-mono">{(hive.reputationScore * 100).toFixed(0)}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Sync Latency</span>
                        <strong className="text-white text-sm font-mono">{hive.latencyMs}ms</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Compute Shares</span>
                        <strong className="text-white text-sm font-mono">{hive.computeShares} GFlop</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Treasury</span>
                        <strong className="text-amber-400 text-sm font-mono">{hive.treasuryBalance} T</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treasury Redistribution Panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-white">Treasury Redistribution</h3>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Symbiotically rebalance token reserves. Diverting energy quotas to slower or high-workload nodes dynamically optimizes total collective throughput.
                </p>

                <form onSubmit={handleTransfer} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Source Hive</label>
                      <select
                        value={sourceHiveId}
                        onChange={(e) => setSourceHiveId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded p-2 text-xs font-mono"
                      >
                        {hives.map(h => (
                          <option key={h.hiveId} value={h.hiveId}>{h.name} ({h.treasuryBalance} T)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Hive</label>
                      <select
                        value={destHiveId}
                        onChange={(e) => setDestHiveId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded p-2 text-xs font-mono"
                      >
                        {hives.map(h => (
                          <option key={h.hiveId} value={h.hiveId}>{h.name} ({h.treasuryBalance} T)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transfer Amount (T)</label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded p-2 text-xs font-mono"
                      min="10"
                      max="15000"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Purpose / Heuristic Allocation Motivation</label>
                    <input
                      type="text"
                      value={transferPurpose}
                      onChange={(e) => setTransferPurpose(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded p-2 text-xs"
                      placeholder="e.g. Compensation for network delay..."
                    />
                  </div>

                  {transferError && <p className="text-rose-400 text-xs font-semibold">{transferError}</p>}
                  {transferSuccess && <p className="text-emerald-400 text-xs font-semibold">Ledger reallocation recorded successfully!</p>}

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5 transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                    Commit Redistribution
                  </button>
                </form>
              </div>

              {/* Mini Treasury Stats */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Federated Reserve Status</span>
                <div className="flex justify-between items-baseline mt-1">
                  <strong className="text-lg font-black text-white">Decentralized Trust</strong>
                  <strong className="text-amber-400 font-mono">50,000 T Allocated</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Treasury Redistribution Ledger History */}
          {treasuryLedger && treasuryLedger.reallocationHistory && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Decentralized Treasury Reallocation History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Source Hive</th>
                      <th className="pb-2">Destination Hive</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Purpose Motivation</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasuryLedger.reallocationHistory.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-850 text-slate-300 hover:bg-slate-850/30">
                        <td className="py-2.5 font-bold text-slate-400">{item.id}</td>
                        <td className="py-2.5 text-purple-400">{item.fromHive}</td>
                        <td className="py-2.5 text-emerald-400">{item.toHive}</td>
                        <td className="py-2.5 text-amber-400 font-bold">{item.amount} T</td>
                        <td className="py-2.5 max-w-xs truncate text-slate-300 font-sans">{item.purpose}</td>
                        <td className="py-2.5 text-slate-500 text-[11px]">{formatTime(item.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Recombinant Mutations */}
      {activeSection === 'recombinant' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Mutation proposals list */}
            <div className="xl:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">Recombinant Mutations</h3>
                <button
                  onClick={() => setShowMutationForm(!showMutationForm)}
                  className="bg-purple-900 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Propose Heuristic
                </button>
              </div>

              {showMutationForm && (
                <form onSubmit={handleProposeMutation} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Propose Mutation</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Proposer Hive</label>
                      <select
                        value={newMutProposedBy}
                        onChange={(e) => setNewMutProposedBy(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                      >
                        {hives.map(h => (
                          <option key={h.hiveId} value={h.hiveId}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Component</label>
                      <input
                        type="text"
                        value={newMutComponent}
                        onChange={(e) => setNewMutComponent(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Target Heuristic</label>
                    <input
                      type="text"
                      value={newMutTarget}
                      onChange={(e) => setNewMutTarget(e.target.value)}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase font-mono">Removed Instructions</label>
                    <textarea
                      value={newMutRemoved}
                      onChange={(e) => setNewMutRemoved(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase font-mono">Mutated Instructions (Added)</label>
                    <textarea
                      value={newMutAdded}
                      onChange={(e) => setNewMutAdded(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Gain Eff %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newMutGainEff}
                        onChange={(e) => setNewMutGainEff(Number(e.target.value))}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Gain Rel %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newMutGainRel}
                        onChange={(e) => setNewMutGainRel(Number(e.target.value))}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Risk Level</label>
                      <select
                        value={newMutRisk}
                        onChange={(e) => setNewMutRisk(e.target.value as RiskLevel)}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-500 text-white rounded font-bold py-2 text-xs uppercase"
                  >
                    Publish Recombinant Proposal
                  </button>
                </form>
              )}

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {mutations.map(mut => {
                  const creatorHive = hives.find(h => h.hiveId === mut.proposedBy);
                  return (
                    <div
                      key={mut.mutationId}
                      onClick={() => setSelectedMutationId(mut.mutationId)}
                      className={`p-4 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                        selectedMutationId === mut.mutationId
                          ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded uppercase ${
                          mut.status === 'DEPLOYED_MUTATION' ? 'bg-emerald-950 text-emerald-400' : mut.status === 'SANDBOX_VERIFIED' ? 'bg-indigo-950 text-indigo-400' : mut.status === 'RESTRICTED' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {mut.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{mut.mutationId}</span>
                      </div>

                      <h4 className="text-white text-sm font-black mt-2 font-sans">{mut.componentAffected}</h4>
                      <p className="text-slate-400 text-xs font-mono mt-0.5">{mut.mutationTarget}</p>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-850 text-[10px]">
                        <span className="text-slate-400 font-sans">Proposed: <strong className="text-slate-200">{creatorHive?.name || 'External'}</strong></span>
                        <span className={`font-bold ${
                          mut.riskLevel === 'CRITICAL' || mut.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-slate-400'
                        }`}>RISK: {mut.riskLevel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected mutation detail viewport */}
            <div className="xl:col-span-2 space-y-6">
              {activeMutation ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
                  {/* Top segment */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-950 text-purple-400 border border-slate-800 font-mono text-[10px] rounded">
                          {activeMutation.componentAffected}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{activeMutation.mutationId}</span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1.5">{activeMutation.mutationTarget}</h3>
                    </div>

                    <div className="flex gap-2 self-stretch md:self-auto">
                      {activeMutation.status === 'PENDING_SANDBOX' && (
                        <button
                          onClick={() => handleRunSandbox(activeMutation.mutationId)}
                          className="flex-1 md:flex-none bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold py-2 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-4 h-4" />
                          Run Sandbox
                        </button>
                      )}

                      {activeMutation.status === 'SANDBOX_VERIFIED' && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1.5 rounded text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Auth By:</span>
                            <input
                              type="text"
                              value={authorizedBy}
                              onChange={(e) => setAuthorizedBy(e.target.value)}
                              className="bg-transparent text-white font-mono w-20 border-0 focus:ring-0 p-0 text-xs"
                            />
                          </div>
                          <button
                            onClick={() => handleSynthesizeDeploy(activeMutation.mutationId)}
                            className="flex-1 md:flex-none bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-4 h-4" />
                            Deploy Mutation
                          </button>
                        </div>
                      )}

                      {activeMutation.status === 'DEPLOYED_MUTATION' && (
                        <button
                          onClick={() => handleRestrict(activeMutation.mutationId)}
                          className="flex-1 md:flex-none bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 font-bold py-2 px-4 rounded text-xs uppercase transition-all"
                        >
                          Veto Heuristic
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sandbox Safety Report summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. Efficiency Boost</span>
                      <strong className="text-xl font-mono text-emerald-400 block mt-1">+{activeMutation.expectedEfficiencyGainPct}%</strong>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. Reliability Boost</span>
                      <strong className="text-xl font-mono text-purple-400 block mt-1">+{activeMutation.expectedReliabilityGainPct}%</strong>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Safety Audit Compliance</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <strong className={`text-xl font-mono ${
                          activeMutation.safetyAuditScore >= 85 ? 'text-emerald-400' : activeMutation.safetyAuditScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{activeMutation.safetyAuditScore}%</strong>
                        {activeMutation.safetyAuditScore >= 85 ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Diff Viewer */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden font-mono text-xs">
                    <div className="bg-slate-900 border-b border-slate-850 px-4 py-2 flex justify-between text-slate-400 text-[10px] font-bold uppercase">
                      <span>Heuristic Patch Diff</span>
                      <span className="text-purple-400">VOLATILE RECOMBO FILE</span>
                    </div>
                    <div className="p-4 space-y-3 overflow-x-auto max-h-48">
                      <div className="text-rose-400 select-none">
                        <span className="inline-block w-4">-</span> {activeMutation.heuristicDiff.removed}
                      </div>
                      <div className="text-emerald-400 select-none border-l-2 border-emerald-500/40 pl-2">
                        <span className="inline-block w-4">+</span> {activeMutation.heuristicDiff.added}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Sandbox Execution logs */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden font-mono text-xs">
                    <div className="bg-slate-900 border-b border-slate-850 px-4 py-2 flex justify-between text-slate-400 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        <span>Sandbox Execution Logs / Security Sandbox Verification</span>
                      </div>
                      <span className="text-emerald-400">ISOLATED ENVELOPE</span>
                    </div>
                    <div className="p-4 bg-slate-950/80 text-slate-300 space-y-1.5 max-h-56 overflow-y-auto">
                      {activeMutation.sandboxExecutionLogs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-slate-500 select-none">[{index + 1}]</span>
                          <span className={log.includes('CRITICAL') || log.includes('RESTRICTION') ? 'text-rose-400' : log.includes('SUCCESS') || log.includes('verified') ? 'text-emerald-400' : 'text-slate-300'}>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-500">
                  <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p>Select or Propose a Recombinant Heuristic Mutation to launch evaluation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Consensus Collaboration Sessions */}
      {activeSection === 'consensus' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">State Synchronization Sessions</h3>
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="bg-purple-900 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Consensus Sync
                </button>
              </div>

              {showSessionForm && (
                <form onSubmit={handleCreateSession} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Sync Request</h4>
                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Title</label>
                    <input
                      type="text"
                      value={newSessTitle}
                      onChange={(e) => setNewSessTitle(e.target.value)}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Objective Goal</label>
                    <input
                      type="text"
                      value={newSessObjective}
                      onChange={(e) => setNewSessObjective(e.target.value)}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Compute Budget (GFlop)</label>
                    <input
                      type="number"
                      value={newSessCompute}
                      onChange={(e) => setNewSessCompute(Number(e.target.value))}
                      className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-500 text-white rounded font-bold py-2 text-xs uppercase"
                  >
                    Initiate Synchronization
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {sessions.map(sess => (
                  <div
                    key={sess.sessionId}
                    className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded uppercase ${
                        sess.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' : sess.status === 'CONSOLIDATED' ? 'bg-purple-950 text-purple-400' : 'bg-amber-950 text-amber-400 animate-pulse'
                      }`}>
                        {sess.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{sess.sessionId}</span>
                    </div>

                    <h4 className="text-white text-sm font-black mt-1">{sess.title}</h4>
                    <p className="text-slate-400 text-xs">{sess.objective}</p>

                    <div className="flex items-center gap-1 flex-wrap pt-2">
                      {sess.participantHives.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[9px] rounded">
                          {p}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-850 text-[10px]">
                      <span className="text-slate-400 font-mono">Compute: <strong className="text-slate-200">{sess.computeAllocated} GFlops</strong></span>
                      {sess.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleAdvanceSession(sess.sessionId)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                        >
                          Step consensus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Active Multi-Hive Consensus Logging Pipeline
              </h3>
              <p className="text-slate-400 text-xs">
                State Consensus synchronization sessions automatically compile distributed tracings across agent clusters. Every step of the pipeline maps direct causal agreements.
              </p>

              <div className="space-y-3 pt-2">
                {sessions.map(sess => (
                  <div key={sess.sessionId} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                      <span>Sync Session Tracking</span>
                      <span>ID: {sess.sessionId}</span>
                    </div>
                    <div className="space-y-1.5">
                      {sess.sharedInsights.map((ins, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-purple-400">▶</span>
                          <span className="text-slate-300 leading-relaxed font-sans">{ins}</span>
                        </div>
                      ))}
                      {sess.sharedInsights.length === 0 && (
                        <div className="text-slate-500 text-xs font-sans">Awaiting consensus stepping initialization. Use the Action button to advance the ledger state machine.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Holographic Consciousness Map */}
      {activeSection === 'hologram' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Control & Add Node Panel */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">Holographic Consciousness</h3>
                  <button
                    onClick={() => setShowNodeForm(!showNodeForm)}
                    className="bg-purple-900 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Fuse Insight
                  </button>
                </div>

                {showNodeForm && (
                  <form onSubmit={handleAddHoloNode} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Fuse Insight Node</h4>
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Insight Label</label>
                      <input
                        type="text"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase">Associated Wisdom Insight</label>
                      <textarea
                        value={newNodeInsight}
                        onChange={(e) => setNewNodeInsight(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900 text-white rounded p-1.5 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block uppercase">Source Hive</label>
                        <select
                          value={newNodeSource}
                          onChange={(e) => setNewNodeSource(e.target.value)}
                          className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                        >
                          {hives.map(h => (
                            <option key={h.hiveId} value={h.name}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block uppercase">Importance Score</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="1"
                          value={newNodeImportance}
                          onChange={(e) => setNewNodeImportance(Number(e.target.value))}
                          className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block uppercase">X Coordinate (0 to 1)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={newNodeX}
                          onChange={(e) => setNewNodeX(Number(e.target.value))}
                          className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block uppercase">Y Coordinate (0 to 1)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={newNodeY}
                          onChange={(e) => setNewNodeY(Number(e.target.value))}
                          className="w-full bg-slate-900 text-white rounded p-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-purple-500 text-white rounded font-bold py-2 text-xs uppercase"
                    >
                      Fuse Insight to Hologram
                    </button>
                  </form>
                )}

                {/* Establish Connection Panel */}
                <form onSubmit={handleConnectHoloNodes} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5" />
                    Establish Insight Connection
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Insight A</label>
                      <select
                        value={connectNode1}
                        onChange={(e) => setConnectNode1(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded p-1 text-[11px] font-mono"
                      >
                        <option value="">Select...</option>
                        {hologram?.nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label.substring(0, 18)}...</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Insight B</label>
                      <select
                        value={connectNode2}
                        onChange={(e) => setConnectNode2(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded p-1 text-[11px] font-mono"
                      >
                        <option value="">Select...</option>
                        {hologram?.nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label.substring(0, 18)}...</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-950 font-bold py-1.5 rounded text-xs uppercase"
                    disabled={!connectNode1 || !connectNode2}
                  >
                    Form Causal Bridge
                  </button>
                </form>

                {/* Nodes directory */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {hologram?.nodes.map(node => (
                    <div key={node.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-left">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-slate-500">ID: {node.id}</span>
                        <span className="text-purple-400">W: {node.importanceScore}</span>
                      </div>
                      <h5 className="text-white text-xs font-bold mt-1">{node.label}</h5>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">Source: {node.sourceHive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Coordinates Hologram Graph Canvas */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">Holographic Consciousness Mapping Plane</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Visual coordinate plane rendering high-dimensional cognitive alignments. Lines reflect established causal bridges of shared wisdom across the federation.
                </p>
              </div>

              {/* The interactive virtual graph plane */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl h-[420px] relative overflow-hidden flex items-center justify-center group select-none">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

                {/* Center Core Consciousness alignment aura */}
                <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse"></div>

                {/* Vector Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
                  {hologram?.nodes.map((node, i) => {
                    const x1 = node.dimensionVector[0] * 320 + 200;
                    const y1 = node.dimensionVector[1] * 200 + 200;
                    
                    return node.connections.map(connId => {
                      const other = hologram.nodes.find(n => n.id === connId);
                      if (!other) return null;
                      const x2 = other.dimensionVector[0] * 320 + 200;
                      const y2 = other.dimensionVector[1] * 200 + 200;
                      
                      return (
                        <line
                          key={`${node.id}-${connId}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(147, 51, 234, 0.45)"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      );
                    });
                  })}
                </svg>

                {/* Nodes Placement */}
                {hologram?.nodes.map(node => {
                  const x = node.dimensionVector[0] * 320 + 200;
                  const y = node.dimensionVector[1] * 200 + 200;

                  return (
                    <div
                      key={node.id}
                      className="absolute p-2 bg-slate-900 border-2 border-purple-500 hover:border-amber-400 rounded-lg text-[9px] font-mono text-slate-300 w-32 shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-105"
                      style={{ left: `${x}px`, top: `${y}px` }}
                      title={`${node.label}: ${node.associatedInsight}`}
                    >
                      <strong className="text-white block truncate">{node.label}</strong>
                      <span className="text-purple-400 text-[8px] font-bold block mt-0.5">{node.sourceHive}</span>
                    </div>
                  );
                })}
              </div>

              {/* Holographic Insight Metrics */}
              {hologram && (
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Global Alignment Affinity</span>
                    <strong className="text-xl font-mono text-purple-400 block mt-1">{hologram.globalConsciousnessAlignmentPct}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Knowledge Entropy Rate</span>
                    <strong className="text-xl font-mono text-amber-400 block mt-1">{hologram.knowledgeEntropy} nat</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
