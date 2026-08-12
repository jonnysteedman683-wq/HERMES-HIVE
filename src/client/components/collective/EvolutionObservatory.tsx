import React, { useState } from 'react';
import { formatTime } from '../../lib/format';
import { usePolling } from '../../hooks/usePolling';
import {
  Brain,
  Users,
  Vote,
  Award,
  BookOpen,
  Coins,
  Compass,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Dna,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  CollectiveObservation,
  SynthesizedAwareness,
  DynamicTeam,
  CollectiveDecisionProposal,
  AgentReputationRecord,
  CollectiveMemoryRecord,
  TaskBid,
  ResourceAllocationRecord,
  EmergentStrategyRecord,
  HiveHealthMetrics,
} from '../../../shared/types';
import { ObjectiveOutcomeAnalysis } from '../../../server/collective/collectiveLearningEngine';
import { AgentEvolutionAction } from '../../../server/collective/agentEvolutionEngine';

export const EvolutionObservatory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'consciousness' | 'teams' | 'decisions' | 'reputation' | 'memory' | 'economics' | 'strategies' | 'health'
  >('consciousness');

  const [observations, setObservations] = useState<CollectiveObservation[]>([]);
  const [awareness, setAwareness] = useState<SynthesizedAwareness[]>([]);
  const [teams, setTeams] = useState<DynamicTeam[]>([]);
  const [decisions, setDecisions] = useState<CollectiveDecisionProposal[]>([]);
  const [reputations, setReputations] = useState<AgentReputationRecord[]>([]);
  const [memories, setMemories] = useState<CollectiveMemoryRecord[]>([]);
  const [learningAnalyses, setLearningAnalyses] = useState<ObjectiveOutcomeAnalysis[]>([]);
  const [bids, setBids] = useState<TaskBid[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocationRecord[]>([]);
  const [strategies, setStrategies] = useState<EmergentStrategyRecord[]>([]);
  const [evolutionActions, setEvolutionActions] = useState<AgentEvolutionAction[]>([]);
  const [health, setHealth] = useState<HiveHealthMetrics | null>(null);

  // New Observation Input
  const [newObsText, setNewObsText] = useState('');
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);

  // New Team Input
  const [newTeamObj, setNewTeamObj] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, tRes, dRes, rRes, mRes, lRes, eRes, sRes, actRes, hRes] = await Promise.all([
        fetch('/api/collective/consciousness').then(r => r.json()).catch(() => ({ observations: [], awareness: [] })),
        fetch('/api/collective/teams').then(r => r.json()).catch(() => ({ teams: [] })),
        fetch('/api/collective/decisions').then(r => r.json()).catch(() => ({ proposals: [] })),
        fetch('/api/collective/reputation').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/collective/memory').then(r => r.json()).catch(() => ({ memories: [] })),
        fetch('/api/collective/learning').then(r => r.json()).catch(() => ({ analyses: [] })),
        fetch('/api/collective/economics').then(r => r.json()).catch(() => ({ bids: [], allocations: [] })),
        fetch('/api/collective/strategies').then(r => r.json()).catch(() => ({ strategies: [] })),
        fetch('/api/collective/evolution/actions').then(r => r.json()).catch(() => ({ actions: [] })),
        fetch('/api/collective/health').then(r => r.json()).catch(() => ({ health: null })),
      ]);

      if (cRes.observations) setObservations(cRes.observations);
      if (cRes.awareness) setAwareness(cRes.awareness);
      if (tRes.teams) setTeams(tRes.teams);
      if (dRes.proposals) setDecisions(dRes.proposals);
      if (rRes.records) setReputations(rRes.records);
      if (mRes.memories) setMemories(mRes.memories);
      if (lRes.analyses) setLearningAnalyses(lRes.analyses);
      if (eRes.bids) setBids(eRes.bids);
      if (eRes.allocations) setAllocations(eRes.allocations);
      if (sRes.strategies) setStrategies(sRes.strategies);
      if (actRes.actions) setEvolutionActions(actRes.actions);
      if (hRes.health) setHealth(hRes.health);
    } catch (err) {
      console.error('[EvolutionObservatory] Error fetching data:', err);
    }
  };

  usePolling(fetchData, 4000);

  const handleAddObservation = async () => {
    if (!newObsText.trim()) return;
    setIsSubmittingObs(true);
    try {
      await fetch('/api/collective/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observation: newObsText, category: 'PERFORMANCE' }),
      });
      setNewObsText('');
      await fetchData();
    } catch (err) {
      console.error('[EvolutionObservatory] Error adding observation:', err);
    } finally {
      setIsSubmittingObs(false);
    }
  };

  const handleFormTeam = async () => {
    if (!newTeamObj.trim()) return;
    setIsSubmittingTeam(true);
    try {
      await fetch('/api/collective/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: newTeamObj }),
      });
      setNewTeamObj('');
      await fetchData();
    } catch (err) {
      console.error('[EvolutionObservatory] Error forming team:', err);
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 rounded-xl border border-purple-500/20 shadow-lg gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              HERMES HIVE — COLLECTIVE INTELLIGENCE OBSERVATORY
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Stage 6 Swarm Evolution
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Living cognitive system: consciousness synthesis, dynamic team formation, collective decisions with dissent preservation, agent reputation, and swarm economics.
            </p>
          </div>
        </div>

        {/* Global Health Indicator */}
        {health && (
          <div className="flex items-center gap-3 font-mono text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Hive Health Score</span>
              <span className="text-emerald-400 font-bold text-sm">{health.hiveHealthScore}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('consciousness')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'consciousness' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" /> Consciousness ({observations.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'teams' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Swarm Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'decisions' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Vote className="w-4 h-4" /> Collective Decisions ({decisions.length})
        </button>
        <button
          onClick={() => setActiveTab('reputation')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'reputation' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" /> Agent Reputation ({reputations.length})
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'memory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Collective Memory ({memories.length})
        </button>
        <button
          onClick={() => setActiveTab('economics')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'economics' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" /> Swarm Economics
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'strategies' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" /> Emergent Strategies
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'health' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Hive Health
        </button>
      </div>

      {/* Tab 1: Hive Consciousness */}
      {activeTab === 'consciousness' && (
        <div className="space-y-6">
          {/* Add Observation Form */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> Contribute Observation to Swarm Consciousness
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter distributed agent or system observation..."
                value={newObsText}
                onChange={(e) => setNewObsText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddObservation}
                disabled={isSubmittingObs || !newObsText.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Publish Observation
              </button>
            </div>
          </div>

          {/* Synthesized Awareness Summary */}
          {awareness.length > 0 && (
            <div className="bg-slate-950/90 rounded-xl border border-purple-500/30 p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Synthesized Situational Awareness
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">
                  Confidence Score: {(awareness[0].confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{awareness[0].summary}</p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                <span className="text-purple-300 font-bold block text-[10px] uppercase">Primary Hypothesis</span>
                <p className="text-slate-300">{awareness[0].primaryHypothesis}</p>
              </div>
            </div>
          )}

          {/* Individual Observations Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Distributed Agent Sensor Streams ({observations.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observations.map((obs) => (
                <div key={obs.id} className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {obs.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{formatTime(obs.timestamp)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-100">{obs.observation}</p>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                    <span>Source: <strong className="text-purple-300">{obs.agentName}</strong></span>
                    <span>Hive: <strong className="text-slate-300">{obs.hiveId}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Swarm Teams */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Form Dynamic Swarm Team
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter objective for dynamic team assembly (e.g. 'Audit PQC signatures across Operations Hive')..."
                value={newTeamObj}
                onChange={(e) => setNewTeamObj(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleFormTeam}
                disabled={isSubmittingTeam || !newTeamObj.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <Users className="w-3.5 h-3.5" /> Assemble Team
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Active Swarm Teams ({teams.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.teamId} className="p-5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {team.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {team.teamId}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{team.objective}</h4>
                    <span className="text-[10px] font-mono text-purple-300">Coordinator: {team.coordinatorAgentId}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div>Members: <strong className="text-slate-300">{team.memberAgentIds.join(', ')}</strong></div>
                    <div>Required Capabilities: <strong className="text-amber-300">{team.requiredCapabilities.join(', ')}</strong></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Token Budget: {team.tokenConsumed.toLocaleString()} / {team.tokenBudget.toLocaleString()}</span>
                    <span>Hive: {team.hiveId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Collective Decisions & Dissent */}
      {activeTab === 'decisions' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Vote className="w-4 h-4 text-purple-400" /> Collective Decisions & Minority Dissent Records ({decisions.length})
            </h3>

            <div className="space-y-4">
              {decisions.map((prop) => (
                <div key={prop.proposalId} className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                        prop.status === 'CONSENSUS_REACHED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        prop.status === 'GOVERNANCE_BLOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {prop.status}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">{prop.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      Confidence: {(prop.consensusConfidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono">{prop.objective}</p>

                  {/* Options & Votes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {prop.options.map((opt) => (
                      <div
                        key={opt.optionId}
                        className={`p-3 rounded-lg border ${
                          prop.consensusOptionId === opt.optionId
                            ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block text-slate-500">Option: {opt.optionId}</span>
                        <p className="font-bold text-slate-200">{opt.description}</p>
                        <p className="text-[10px] text-emerald-400 pt-1">{opt.expectedOutcome}</p>
                      </div>
                    ))}
                  </div>

                  {/* Dissent Section */}
                  {prop.dissentRecords.length > 0 && (
                    <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-500/30 space-y-2">
                      <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Preserved Minority Dissent ({prop.dissentRecords.length})
                      </span>
                      {prop.dissentRecords.map((d, idx) => (
                        <div key={idx} className="text-xs font-mono text-amber-200/90 space-y-1">
                          <p><strong>Dissenting Agent:</strong> {d.agentId}</p>
                          <p><strong>Rationale:</strong> {d.rationale}</p>
                          <p className="text-[10px] text-amber-400/80">Evidence: {d.evidence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Agent Reputation */}
      {activeTab === 'reputation' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-purple-400" /> Evidence-Based Agent Reputation Leaderboard ({reputations.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reputations.map((rec) => (
                <div key={rec.agentId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{rec.agentName}</h4>
                      <span className="text-[10px] font-mono text-purple-300">{rec.role}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Composite</span>
                      <span className="text-sm font-bold font-mono text-amber-400">{rec.compositeReputation}/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div>Accuracy: <strong className="text-emerald-400">{rec.accuracyScore}%</strong></div>
                    <div>Reliability: <strong className="text-cyan-400">{rec.reliabilityScore}%</strong></div>
                    <div>Policy Compliance: <strong className="text-emerald-400">{rec.policyCompliancePct}%</strong></div>
                    <div>Prediction Accuracy: <strong className="text-purple-300">{rec.predictionAccuracyPct}%</strong></div>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 italic">
                    Latest Evidence: {rec.evidenceLogs[0]?.event}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Collective Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-purple-400" /> Institutional Collective Memory ({memories.length})
            </h3>

            <div className="space-y-3">
              {memories.map((mem) => (
                <div key={mem.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {mem.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{formatTime(mem.timestamp)}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-100">{mem.content}</p>

                  <div className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-slate-400 space-y-1">
                    <div>Evidence: <strong className="text-emerald-300">{mem.evidence}</strong></div>
                    <div>Sources: <strong className="text-purple-300">{mem.sourceAgentIds.join(', ')}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Swarm Economics */}
      {activeTab === 'economics' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Coins className="w-4 h-4 text-purple-400" /> Task Bidding & Resource Allocation Market
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allocations */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Hive Token Quotas ({allocations.length})</h4>
                {allocations.map((a) => (
                  <div key={a.allocationId} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>{a.hiveId}</span>
                      <span className="text-purple-300">Priority: {a.priorityScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Used: {a.tokensUsed.toLocaleString()} / {a.tokensAllocated.toLocaleString()}</span>
                      <span>Starvation Risk: {a.starvationRisk ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bids */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Submitted Task Bids ({bids.length})</h4>
                {bids.map((b) => (
                  <div key={b.bidId} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>{b.agentName}</span>
                      <span className="text-amber-400">Bid Score: {b.bidScore}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Task: {b.taskId}</p>
                    <p className="text-[10px] text-emerald-400">Cost: {b.estimatedTokenCost.toLocaleString()} tokens</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Emergent Strategies */}
      {activeTab === 'strategies' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-4 h-4 text-purple-400" /> Swarm Generated Emergent Strategies ({strategies.length})
            </h3>

            <div className="space-y-4">
              {strategies.map((s) => (
                <div key={s.strategyId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      STATUS: {s.status}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      Consensus: {s.consensusScore}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{s.title}</h4>
                  <p className="text-[11px] text-slate-300">{s.objective}</p>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                    <strong className="text-purple-300 text-[10px] uppercase block">Proposed Steps</strong>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                      {s.proposedSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Hive Health */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-purple-400" /> Explainable Hive Health Scorecard
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Agent Availability</span>
                <span className="text-emerald-400 font-bold text-sm">{health.agentAvailabilityPct}%</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Coordination Efficiency</span>
                <span className="text-cyan-400 font-bold text-sm">{health.coordinationEfficiencyPct}%</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Governance Stability</span>
                <span className="text-emerald-400 font-bold text-sm">{health.governanceStabilityPct}%</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Recovery Rate</span>
                <span className="text-purple-300 font-bold text-sm">{health.recoveryRatePct}%</span>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <h4 className="text-purple-300 font-bold text-[10px] uppercase">Explainability Logs</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {health.explainability.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
