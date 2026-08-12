import React, { useState } from 'react';
import { formatTime } from '../../utils/format';
import { usePolling } from '../../hooks/usePolling';
import { Activity, GitMerge, XCircle, RotateCcw, Zap, Brain, Trophy, RefreshCw } from 'lucide-react';

interface AgentScore { cycles: number; total_score: number; total_commits: number; avg_score: number }
interface RepoStatus { name: string; cycle: number; quality: { agents: Record<string, AgentScore>; cycles: number } | null }
interface SwarmData { repos: RepoStatus[]; timestamp: string }
interface LearningsData { content: string; timestamp: string }

const SWARM_POLL_MS = 15000;

export const SwarmMonitor: React.FC = () => {
  const [data, setData] = useState<SwarmData | null>(null);
  const [learnings, setLearnings] = useState<LearningsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statusRes, learnRes] = await Promise.all([
        fetch('/api/swarm/status'), fetch('/api/swarm/learnings'),
      ]);
      setData(await statusRes.json());
      setLearnings(await learnRes.json());
      setError(null);
    } catch { setError('Swarm data unavailable — swarm may not have run yet.'); }
  };

  usePolling(fetchData, SWARM_POLL_MS);

  if (error && !data) {
    return <div className="p-8 text-center text-slate-400">
      <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
      <p>{error}</p>
    </div>;
  }

  const totalCycles = data?.repos.reduce((s, r) => s + r.cycle, 0) || 0;
  const rankedAgents = (): [string, AgentScore][] => {
    const all: Record<string, AgentScore> = {};
    data?.repos.forEach(r => { if (r.quality?.agents) Object.assign(all, r.quality.agents); });
    return Object.entries(all).sort((a, b) => b[1].avg_score - a[1].avg_score);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extralight tracking-[0.15em] text-white flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 heartbeat" /> <span className="text-grad-amber font-light">Swarm Monitor</span>
          </h2>
          <p className="text-sm font-light text-slate-400 mt-1 tracking-wide">
            {data?.repos.length || 0} repo(s) · {totalCycles} cycles · auto-refreshes
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-amber-300 border border-amber-500/15 hover:border-amber-500/40 transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Repo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.repos.map(repo => {
          const q = repo.quality;
          const agents = q?.agents ? Object.entries(q.agents) : [];
          return (
            <div key={repo.name} className="glass glass-hover p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-light tracking-wide text-white">{repo.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  Cycle #{repo.cycle}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/40 border border-white/5 rounded-lg p-2">
                  <div className="text-lg font-light text-emerald-400"><GitMerge className="w-4 h-4 inline mr-1" />{q?.cycles || 0}</div>
                  <div className="text-xs text-slate-500">cycles</div>
                </div>
                <div className="bg-slate-800/40 border border-white/5 rounded-lg p-2">
                  <div className="text-lg font-light text-purple-400"><Brain className="w-4 h-4 inline mr-1" />{agents.length}</div>
                  <div className="text-xs text-slate-500">models</div>
                </div>
                <div className="bg-slate-800/40 border border-white/5 rounded-lg p-2">
                  <div className="text-lg font-light text-amber-400"><Trophy className="w-4 h-4 inline mr-1" />{agents.reduce((s, [_, a]) => s + (a as { total_commits: number }).total_commits, 0)}</div>
                  <div className="text-xs text-slate-500">commits</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality Leaderboard */}
      {rankedAgents().length > 0 && (
        <div className="glass p-4">
          <h3 className="font-light tracking-wide text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> <span className="text-grad-amber font-light">Model Quality</span>
            <span className="text-slate-500 text-xs">(avg score)</span>
          </h3>
          <div className="space-y-2">
            {rankedAgents().slice(0, 8).map(([model, score], i) => (
              <div key={model} className="flex items-center gap-3 bg-slate-800/30 border border-white/5 rounded-lg p-2">
                <span className="text-xs font-mono w-6 text-amber-500/70">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light text-slate-300 truncate">{model}</div>
                  <div className="text-xs text-slate-500">{score.total_commits} commits · {score.cycles} cycles</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400 rounded-full transition-all" style={{ width: `${Math.min(score.avg_score, 100)}%` }} />
                  </div>
                  <span className="text-sm font-mono text-amber-400 w-10 text-right">{score.avg_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Learnings */}
      {learnings?.content && (
        <div className="glass p-4">
          <h3 className="font-light tracking-wide text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> <span className="text-grad-violet font-light">Recent Learnings</span>
          </h3>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
            {learnings.content}
          </pre>
        </div>
      )}

      {/* Status bar */}
      <div className="text-xs text-slate-600 text-center">
        Updated: {formatTime(data?.timestamp)}
      </div>
    </div>
  );
};
