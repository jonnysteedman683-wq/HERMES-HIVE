import React, { useState } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { Brain, Network, BookOpen, MessageSquareCode, Award, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { DebateRecord, WorldEntity, WorldRelationship, SwarmLearningRecord } from '../../../shared/types';

export const CognitionCenter: React.FC = () => {
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [graph, setGraph] = useState<{ entities: WorldEntity[]; relationships: WorldRelationship[] }>({
    entities: [],
    relationships: [],
  });
  const [learnings, setLearnings] = useState<SwarmLearningRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'debates' | 'world' | 'learning'>('debates');

  const fetchData = async () => {
    try {
      const [debRes, worldRes, lrnRes] = await Promise.all([
        fetch('/api/cognition/debates').then((r) => r.json()).catch(() => ({ debates: [] })),
        fetch('/api/world/graph').then((r) => r.json()).catch(() => ({ graph: { entities: [], relationships: [] } })),
        fetch('/api/learning').then((r) => r.json()).catch(() => ({ learnings: [] })),
      ]);

      if (debRes.debates) setDebates(debRes.debates);
      if (worldRes.graph) setGraph(worldRes.graph);
      if (lrnRes.learnings) setLearnings(lrnRes.learnings);
    } catch (err) {
      console.error('[CognitionCenter] Error fetching cognitive data:', err);
    }
  };

  usePolling(fetchData, 4000);

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 rounded-xl border border-indigo-500/20 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              COGNITIVE EVOLUTION & WORLD MODEL CENTER
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                Swarm Intelligence
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-agent strategy debates, environmental topology graph, and validated procedural learning base.
            </p>
          </div>
        </div>

        {/* Sub-tab Selectors */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('debates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'debates'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareCode className="w-4 h-4" /> Cognitive Debates ({debates.length})
          </button>
          <button
            onClick={() => setActiveSubTab('world')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'world'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" /> World Graph ({graph.entities.length})
          </button>
          <button
            onClick={() => setActiveSubTab('learning')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'learning'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Swarm Knowledge ({learnings.length})
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Cognitive Debates & Decision Trace */}
      {activeSubTab === 'debates' && (
        <div className="space-y-4">
          {debates.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/80 rounded-xl border border-slate-800">
              <MessageSquareCode className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No active cognitive debates recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Multi-agent debates trigger automatically when complex multi-task missions are launched.</p>
            </div>
          ) : (
            debates.map((debate) => (
              <div key={debate.id} className="p-5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider">
                      DEBATE TRACE #{debate.id.slice(-6)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{debate.topic}</h3>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                      Consensus Confidence: {Math.round(debate.consensusConfidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Proposals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {debate.proposals.map((prop) => {
                    const isWinner = prop.id === debate.winningProposalId;
                    return (
                      <div
                        key={prop.id}
                        className={`p-4 rounded-xl border space-y-2 transition-all ${
                          isWinner
                            ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                            : 'bg-slate-900/50 border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-indigo-300 font-semibold">{prop.agentName}</span>
                          {isWinner && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Award className="w-3 h-3" /> SELECTED STRATEGY
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">{prop.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{prop.strategySummary}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                          <span>Tokens: {prop.estimatedCostTokens}</span>
                          <span>Time: {prop.estimatedTimeSec}s</span>
                          <span>Confidence: {Math.round(prop.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Decision & Objections Summary */}
                <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-indigo-400 font-mono text-[11px] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Hermes Synthesis & Final Strategy Rationale:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{debate.finalDecisionSummary}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-tab 2: World Model Topology Graph */}
      {activeSubTab === 'world' && (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              World Model Environment Entities ({graph.entities.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Real-time state and relationship graph</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {graph.entities.map((entity) => (
              <div key={entity.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                    {entity.type}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{entity.name}</h4>
                <p className="text-[11px] text-slate-400 leading-snug">{entity.description}</p>
                <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 space-y-1">
                  {Object.entries(entity.state).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-300">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Swarm Knowledge & Learning Records */}
      {activeSubTab === 'learning' && (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Promoted Swarm Knowledge Base ({learnings.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Validated procedural findings stored in semantic memory</span>
          </div>

          <div className="space-y-3">
            {learnings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No promoted learning records yet.</p>
            ) : (
              learnings.map((lrn) => (
                <div key={lrn.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {lrn.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{lrn.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded border border-slate-800/80">
                      {lrn.knowledgeContent}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      Confidence: {Math.round(lrn.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
