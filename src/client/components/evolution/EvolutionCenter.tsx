import React, { useEffect, useState } from 'react';
import {
  Dna,
  FlaskConical,
  Sparkles,
  GitMerge,
  Briefcase,
  Layers,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  History,
  Plus,
  Brain,
} from 'lucide-react';
import {
  EvolutionHypothesis,
  ExperimentRecord,
  CapabilityGene,
  PortfolioItem,
  ResearchProgram,
  EvolutionProposal,
} from '../../../shared/types';
import { EvolutionMemoryItem } from '../../../server/evolution/evolutionMemory';
import { Stage9CausalLearning } from './Stage9CausalLearning';
import { Stage10Symbiosis } from './Stage10Symbiosis';

export const EvolutionCenter: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<EvolutionHypothesis[]>([]);
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [genome, setGenome] = useState<CapabilityGene[]>([]);
  const [proposals, setProposals] = useState<EvolutionProposal[]>([]);
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [programs, setPrograms] = useState<ResearchProgram[]>([]);
  const [memoryItems, setMemoryItems] = useState<EvolutionMemoryItem[]>([]);

  const [activeTab, setActiveTab] = useState<'causal_learning' | 'stage10_symbiosis' | 'experiments' | 'genome' | 'portfolio' | 'proposals' | 'timeline'>('stage10_symbiosis');

  const [newHypStatement, setNewHypStatement] = useState('');
  const [isCreatingHyp, setIsCreatingHyp] = useState(false);

  const fetchData = async () => {
    try {
      const [hypRes, expRes, genRes, propRes, projRes, progRes, memRes] = await Promise.all([
        fetch('/api/evolution/hypotheses').then(r => r.json()).catch(() => ({ hypotheses: [] })),
        fetch('/api/evolution/experiments').then(r => r.json()).catch(() => ({ experiments: [] })),
        fetch('/api/evolution/genome').then(r => r.json()).catch(() => ({ genome: [] })),
        fetch('/api/evolution/proposals').then(r => r.json()).catch(() => ({ proposals: [] })),
        fetch('/api/portfolio/projects').then(r => r.json()).catch(() => ({ projects: [] })),
        fetch('/api/research/programs').then(r => r.json()).catch(() => ({ programs: [] })),
        fetch('/api/evolution/memory').then(r => r.json()).catch(() => ({ memory: [] })),
      ]);

      if (hypRes.hypotheses) setHypotheses(hypRes.hypotheses);
      if (expRes.experiments) setExperiments(expRes.experiments);
      if (genRes.genome) setGenome(genRes.genome);
      if (propRes.proposals) setProposals(propRes.proposals);
      if (projRes.projects) setProjects(projRes.projects);
      if (progRes.programs) setPrograms(progRes.programs);
      if (memRes.memory) setMemoryItems(memRes.memory);
    } catch (err) {
      console.error('[EvolutionCenter] Error loading Stage 5B data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateHypothesis = async () => {
    if (!newHypStatement.trim()) return;
    setIsCreatingHyp(true);
    try {
      await fetch('/api/evolution/hypotheses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: newHypStatement,
          evidence: 'Empirical observation of agent latency during peak hours',
          expectedEffect: '25% performance improvement',
          measurementMetric: 'Task Completion Speed (ms)',
        }),
      });
      setNewHypStatement('');
      await fetchData();
    } catch (err) {
      console.error('[EvolutionCenter] Error creating hypothesis:', err);
    } finally {
      setIsCreatingHyp(false);
    }
  };

  const handlePromoteExperiment = async (experimentId: string) => {
    try {
      await fetch('/api/evolution/experiments/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      });
      await fetchData();
    } catch (err) {
      console.error('[EvolutionCenter] Error promoting experiment:', err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 rounded-xl border border-amber-500/20 shadow-lg gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Dna className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AUTONOMOUS EVOLUTION & CAPABILITY GENESIS
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Stage 5B Executive Intelligence
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Controlled self-improvement loop: hypothesis generation, sandbox experimentation, capability genome, portfolio intelligence, and rollback safety.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span>Experiments: <strong className="text-amber-300">{experiments.length}</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Active Projects: <strong className="text-cyan-300">{projects.filter(p => p.status === 'ACTIVE').length}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stage10_symbiosis')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'stage10_symbiosis' ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-md shadow-purple-950/45' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Stage 10 Symbiosis
        </button>
        <button
          onClick={() => setActiveTab('causal_learning')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'causal_learning' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4 text-amber-400" /> Causal Learning & Evolution
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'experiments' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Experiment Lab ({experiments.length})
        </button>
        <button
          onClick={() => setActiveTab('genome')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'genome' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dna className="w-4 h-4" /> Capability Genome ({genome.length})
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'portfolio' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Portfolio Manager ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'proposals' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Evolution Proposals ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'timeline' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Evolutionary Memory
        </button>
      </div>

      {/* Tab 0B: Stage 10 Symbiosis & Hyper-Evolution */}
      {activeTab === 'stage10_symbiosis' && (
        <Stage10Symbiosis />
      )}

      {/* Tab 0: Causal Learning & Evolution */}
      {activeTab === 'causal_learning' && (
        <Stage9CausalLearning />
      )}

      {/* Tab 1: Experiment Lab */}
      {activeTab === 'experiments' && (
        <div className="space-y-6">
          {/* Create Hypothesis Form */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400" /> Formulate Improvement Hypothesis
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter improvement hypothesis (e.g. 'Adding specialized review agent reduces build errors by 40%')..."
                value={newHypStatement}
                onChange={(e) => setNewHypStatement(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCreateHypothesis}
                disabled={isCreatingHyp || !newHypStatement.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Formulate
              </button>
            </div>
          </div>

          {/* Formulated Hypotheses List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Formulated Hypotheses ({hypotheses.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hypotheses.map((h) => (
                <div key={h.hypothesisId} className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      CONFIDENCE: {(h.confidenceScore * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{h.hypothesisId}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-100">{h.statement}</h5>
                  <p className="text-[11px] text-slate-400"><strong>Evidence:</strong> {h.evidence}</p>
                  <p className="text-[10px] font-mono text-emerald-400">Metric: {h.measurementMetric}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experiments List */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Isolated Experiments & A/B Benchmarks ({experiments.length})</h4>
            <div className="space-y-4">
              {experiments.map((exp) => (
                <div key={exp.experimentId} className="p-5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                          exp.status === 'PROMOTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          exp.status === 'VERIFIED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {exp.status}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{exp.title}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Sandbox Level: {exp.isolationLevel}</span>
                    </div>

                    {exp.status === 'VERIFIED' && (
                      <button
                        onClick={() => handlePromoteExperiment(exp.experimentId)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Promote to Production
                      </button>
                    )}
                  </div>

                  {/* A/B Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-slate-500 block uppercase text-[10px]">Baseline Strategy</span>
                      <p className="text-slate-300 font-bold">{exp.baselineStrategy}</p>
                      <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                        <span>Latency: {exp.metrics.baselineLatencyMs}ms</span>
                        <span>Success: {exp.metrics.baselineSuccessRatePct}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/30 space-y-1">
                      <span className="text-amber-400 block uppercase text-[10px]">Candidate Strategy</span>
                      <p className="text-amber-200 font-bold">{exp.candidateStrategy}</p>
                      <div className="text-[10px] text-emerald-400 flex justify-between pt-1 border-t border-slate-800">
                        <span>Latency: {exp.metrics.candidateLatencyMs}ms</span>
                        <span>Success: {exp.metrics.candidateSuccessRatePct}%</span>
                      </div>
                    </div>
                  </div>

                  {exp.resultsSummary && (
                    <p className="text-xs text-emerald-300 bg-slate-900 p-3 rounded-lg border border-emerald-500/20 font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{exp.resultsSummary}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Capability Genome */}
      {activeTab === 'genome' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Dna className="w-4 h-4 text-amber-400" /> Organizational Capability Genome ({genome.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {genome.map((g) => (
                <div key={g.capabilityId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {g.state}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Confidence: {(g.confidenceScore * 100).toFixed(0)}%</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{g.capabilityId}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Category: {g.category}</span>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div>Tools: <strong className="text-slate-300">{g.requiredTools.join(', ')}</strong></div>
                    <div>Agents: <strong className="text-purple-300">{g.requiredAgents.join(', ')}</strong></div>
                    <div>Models: <strong className="text-cyan-300">{g.requiredModels.join(', ')}</strong></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>Performance: <strong className="text-emerald-400">{g.performancePct}%</strong></span>
                    <span>Reliability: <strong className="text-cyan-400">{g.reliabilityPct}%</strong></span>
                    <span>Cost: <strong className="text-slate-300">{g.costTokensPerOp} t/op</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Portfolio Manager */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Briefcase className="w-4 h-4 text-amber-400" /> Strategic Portfolio Manager ({projects.length})
            </h3>

            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.projectId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                        {proj.status}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100">{proj.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Strategic Value: {proj.strategicValue}/100</span>
                  </div>

                  <p className="text-[11px] text-slate-400">{proj.description}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Progress</span>
                      <span>{proj.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-amber-500 h-full transition-all" style={{ width: `${proj.progressPct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Tokens: {proj.costTokensConsumed.toLocaleString()} / {proj.costTokensBudget.toLocaleString()}</span>
                    <span>Assigned Hive: {proj.assignedHiveId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Programs */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-purple-400" /> Autonomous Research Programs ({programs.length})
            </h3>

            <div className="space-y-3">
              {programs.map((prog) => (
                <div key={prog.programId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-100">{prog.title}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Domain: {prog.domain}</p>
                  <div className="bg-slate-950 p-2.5 rounded text-[11px] text-slate-300 space-y-1">
                    <strong>Research Questions:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {prog.questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Evolution Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" /> Governed Evolution Proposals ({proposals.length})
            </h3>

            <div className="space-y-4">
              {proposals.map((p) => (
                <div key={p.proposalId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      STATUS: {p.verificationStatus}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {p.proposalId}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{p.title}</h4>
                  <p className="text-[11px] text-slate-300">{p.changeDescription}</p>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono">
                    <div className="text-slate-400"><strong>Expected Benefit:</strong> {p.expectedBenefit}</div>
                    <div className="text-slate-400"><strong>Simulation:</strong> {p.simulationResults}</div>
                    <div className="text-emerald-300"><strong>Rollback Strategy:</strong> {p.rollbackPlan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Evolutionary Memory */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-amber-400" /> Evolutionary Memory & Recorded Outcomes ({memoryItems.length})
            </h3>

            <div className="space-y-4">
              {memoryItems.map((item) => (
                <div key={item.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                      item.type === 'SUCCESSFUL_IMPROVEMENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(item.recordedAt).toLocaleTimeString()}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.summary}</p>
                  <p className="text-[10px] font-mono text-purple-300 bg-slate-950 p-2 rounded border border-slate-800">
                    Evidence: {item.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
